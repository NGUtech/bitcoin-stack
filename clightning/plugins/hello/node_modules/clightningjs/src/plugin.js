const EventEmitter = require('events');
const path = require('path');
const RpcMethod = require('./method.js');
const RpcWrapper = require('./rpc.js');

class Notification extends EventEmitter {};

class Plugin {
  constructor (dynamic) {
    // name: { type: "", default: "", description: "" }
    this.options = {};
    // RpcMethods
    this.methods = [];
    // name: Notification()
    this.notifications = {};
    // name: callback
    this.hooks = {};
    this.rpc = undefined;
    // Plugins are dynamic by default
    this.dynamic = dynamic || true;
  }

  // Beware with writing on stdout !
  // https://nodejs.org/api/process.html#process_a_note_on_process_i_o
  async _write (content) {
    // Could have been a fs writing to 1 ?
    if (!process.stdout.write(content)) {
      return new Promise((resolve, reject) => {
        process.stdout.once('drain', resolve(true));
        process.stdout.once('error', reject(false));
      });
    }
    return Promise.resolve(true);
  }

  // The getmanifest call, all about us !
  _getmanifest (params) {
    let opts = [];
    for (let name in this.options) {
      opts.push({
        name: name,
        type: this.options[name].type,
        default: this.options[name].default,
        description: this.options[name].description
      });
    }
    let notifs = [];
    for (let name in this.notifications) {
      notifs.push(name);
    }
    let hooks = [];
    for (let name in this.hooks) {
      hooks.push(name);
    }
    return {
      options: opts,
      rpcmethods: this.methods.map(function (method) {
        return {
          name: method.name,
          usage: method.usage,
          description: method.description,
          long_description: method.longDescription
        }
      }),
      subscriptions: notifs,
      hooks: hooks,
      dynamic: this.dynamic,
    }
  }

  // We are almost done ! Lightningd sends this once it receives our manifest.
  _init (params) {
    const socketPath = path.join(params.configuration['lightning-dir'], params.configuration['rpc-file']);
    this.rpc = new RpcWrapper(socketPath);
    for (let opt in params.options) {
      this.options[opt].value = params.options[opt];
    }
    this.startup = params.configuration['startup'];
    this.onInit(params);
    // It's not interpreted by lightningd for now.
    return {};
  }

  async _writeJsonrpcNotification (fd, method, params) {
    const payload = {
      jsonrpc: '2.0',
      method: method,
      params: params,
    }
    if (!await this._write(JSON.stringify(payload))) {
      throw new Error("Error while writing JSONRPC notification to lightningd");
    }
  }

  async _writeJsonrpcResponse (fd, result, id) {
    const payload = {
      jsonrpc: '2.0',
      result: result,
      id: id
    };
    if (!await this._write(JSON.stringify(payload))) {
      throw new Error("Error while writing JSONRPC response to lightningd");
    }
  }

  // Add a fresh JSONRPC method accessible from lightningd
  addMethod (name, callback, usage, description, longDescription) {
    if (!name || !callback) {
      throw new Error("You need to pass at least a name and a callback to register a method");
    }
    const method = new RpcMethod(name, usage, description, longDescription);
    method.main = callback;
    this.methods.push(method);
  }

  // Add a startup option to lightningd
  addOption (name, defaultValue, description, type) {
    if (!name || !defaultValue || !description) {
      throw new Error("You need to pass at least a name, default value and description for the option");
    }
    this.options[name] = {
      default: defaultValue,
      description: description,
      type: type || "string",
      value: defaultValue
    };
  }

  // A hook is a notification which needs a response from our (plugin) side
  addHook (name, callback) {
    this.hooks[name] = callback;
  }

  // The notifications are notifications that are real notifications :-)
  subscribe (name) {
    this.notifications[name] = new Notification();
  }

  // To be overriden to do something special at startup
  onInit (params) {
  }

  // Send logs to lightningd's log
  log (message, level) {
    level = level || 'info';
    if (!message || typeof message !== 'string') {
      throw new Error('You need to specify a string to write on lightningd\'s logs.');
    }
    message.split('\n').forEach((line) => {
      if (line) {
        // Note that this is async and not awaited
        this._writeJsonrpcNotification(process.stdout, 'log', {level: level, message: line});
      }
    });
  }

  // Read from stdin and do what master (not Satoshi, lightningd!!) tells until
  // we die
  async _mainLoop () {
    let chunk;
    let msg;
    while (chunk = process.stdin.read()) {
      try {
        msg = JSON.parse(chunk);
      } catch (e) {
        console.log(e);
        // Don't crash because of noise
        continue;
      }
      // JSONRPC2 sanity checks
      if (!msg || !msg.method || msg.jsonrpc !== '2.0') {
        continue;
      }
      if (!msg.id && msg.method in this.notifications) {
        this.notifications[msg.method].emit(msg.method, msg.params);
      }
      if (msg.method === 'getmanifest') {
        await this._writeJsonrpcResponse(process.stdout,
                                         this._getmanifest(msg.params),
                                         msg.id);
        continue;
      }
      if (msg.method === 'init') {
        await this._writeJsonrpcResponse(process.stdout,
                                         this._init(msg.params),
                                         msg.id);
        continue;
      }
      if (msg.method in this.hooks) {
        await this._writeJsonrpcResponse(process.stdout,
                                         this.hooks[msg.method](msg.params),
                                         msg.id);
        continue;
      }
      this.methods.forEach((m) => {
        if (m.name === msg.method) {
          Promise.resolve(m.main(msg.params)).then((response) => {
            Promise.resolve(this._writeJsonrpcResponse(process.stdout, response, msg.id));
          });
        }
      });
    }
  }

  // Start plugining !
  start () {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      this._mainLoop();
    });
  }
}

module.exports = Plugin;
