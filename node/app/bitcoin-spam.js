require('dotenv');
const BitcoinJsonRpc = require('bitcoin-json-rpc').default;

const url = 'http://'+process.env.BITCOIN_RPC_USER
  +':'+process.env.BITCOIN_RPC_PASSWORD
  +'@'+process.env.BITCOIN_HOST
  +':'+process.env.BITCOIN_RPC_PORT;
const bitcoind = new BitcoinJsonRpc(url);

(async () => {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j <= Math.floor(Math.random() * (150 - 50 + 1) + 50); j++) {
      let newAddress = await bitcoind.getNewAddress();
      let unfundedTx = await bitcoind.createRawTransaction([], {[newAddress]: '0.005'});
      let randFee = 0.00001 * Math.pow(1.1892, Math.floor(Math.random() * 29));
      let fundedTx = await bitcoind.fundRawTransaction(unfundedTx, {feeRate: randFee.toFixed(8).toString()});
      let signedTx = await bitcoind.signRawTransactionWithWallet(fundedTx.hex);
      let sentTx = await bitcoind.sendRawTransaction(signedTx.hex);
      total += 1;
      if (total % 25 === 0) {
        blockhashes = await bitcoind.generateToAddress(1, await bitcoind.getNewAddress());
        console.log(total, blockhashes);
      }
    }
  }
})();
