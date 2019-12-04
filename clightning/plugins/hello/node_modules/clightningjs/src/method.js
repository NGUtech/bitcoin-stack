class RpcMethod {
  constructor (name, usage, description, longDescription) {
    this.name = name || "";
    this.usage = usage || "";
    this.description = description || "No description provided.";
    this.longDescription = longDescription || "No detailed description provided";
    this.main = () => {return {}};
  }
}

module.exports = RpcMethod;
