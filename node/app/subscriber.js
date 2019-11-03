require('dotenv');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');

// file paths
const macaroonPath = '/alice_shared/invoice.macaroon';
const tlsCertPath = '/alice_shared/tls.cert';
const rpcProtoPath = 'rpc.proto';

// setup grpc connection to lnd
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
const macaroon = fs.readFileSync(macaroonPath).toString('hex');
let metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});
const lndCert = fs.readFileSync(tlsCertPath);
const sslCreds = grpc.credentials.createSsl(lndCert);
const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
const packageDefinition = protoLoader.loadSync(
  rpcProtoPath,
  {keepCase:true, longs:String, defaults:true, enums:String}
);
const packageObject = grpc.loadPackageDefinition(packageDefinition);
const lnrpc = packageObject.lnrpc;
const lndHost = process.env.LNDALICE_HOST+':'+process.env.LNDALICE_RPC_PORT;
const lnd = new lnrpc.Lightning(lndHost, credentials);

// subscribe to lightning invoice events
lnd.subscribeInvoices({})
.on('data', function(invoice) {
  // convert byte buffers to hex strings
  invoice.receipt = ''; //receipt is deprecated
  invoice.r_hash = invoice.r_hash.toString('hex');
  invoice.r_preimage = invoice.r_preimage.toString('hex');
  invoice.description_hash = invoice.description_hash.toString('hex');

  // process invoice message directly or pass on to a peristent queue
  // for processing by a secondary service.
  console.log(JSON.stringify(invoice, null, 2))
});

console.log('Subscriber connected to LND @ ' + lndHost);