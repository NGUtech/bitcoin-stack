# Docker setup for Bitcoin, Elements/Liquid, LND, Clightning, & Eclair in regtest mode

### ONLY FOR DEVELOPMENT and TESTING. These tools may not be suitable for production deployments.


```
     ┌--------------------------------------------------------------------┐
L+:  |                       YOUR APPLICATION STACK                       |
     └---------------------------------+-------+--------------------------┘
                                       |       |
                    ┌---------┐        |       |
                    |         |        |       |
                    |  FRANK  |╟-------┤       ├------┐
                    |         |        |       |      |
                    └----+----┘        |       |      |
                         |             |       |      |
           ┌-------------|-----------┐ ╧       |      ╧
     ┌-----+-----┐  ┌----+----┐  ┌---+-------┐ | ┌----------┐  ┌----------┐
     |           |  |         |  |           | | |          |  |          |
L2:  |   ALICE   +--+   BOB   +--+   CAROL   | | |   DAVE   +--+   EMMA   |
     |           |  |         |  |           | | |          |  |          |
     └-----+-----┘  └----+----┘  └-----+-----┘ | └----+-----┘  └-----+----┘
           |             |             |       |      |              |
           |             | ┌---------┐ |       |     ┌+--------------+┐
           |             | | ELECTRS |╟|-------┤     |      $LBTC     |
           |             | └----+----┘ |       |     └+--------------+┘
           |             |      |      |       |      |              |
           |   ┌---------+------+-┐    |       |    ┌-+--------------+-┐
           └---+                  +----┘       |    |                  |
L1:            |     BITCOIN      |╟-----------┴---╢|     ELEMENTS     |
               |                  +-----------------+                  |
               └------------------┘                 └------------------┘
```

This `docker-compose` template launches `bitcoin`, two `lnd` containers named `alice` & `bob`, with a `clightning` container as `carol`, and an `eclair` container as `frank`.

Additionally it can launch an `elements` sidechain (aka Liquid), with `clightning` implementation containers as `dave` & `emma` servicing the LBTC asset.

An application demo node is include which demonstrates how to connect to LND and listen to invoice messages and is able to generate transaction spam for fee estimation.

An `electrs` server is provided as another test app for exposing the Electrum protocol wrapper for `bitcoin`.

Everything is configured to run in **regtest** mode but can be adjusted as required. Images are provided for AMD64 and ARM64 architectures but you may have to manually build for others (see bottom).

## See the [changelog](CHANGELOG.md) before upgrading.

### Notes & prerequisites
 - `docker` and `docker-compose` installation is required (https://docs.docker.com/install/).
 - `jq` tool is used in examples for parsing json responses.
 - All nodes will sync to chain after the first Bitcoin & Elements regtest blocks are generated.
 - Precompiled images are provided on Docker Hub but it is not recommended to use them in production environments.
 - Ports and other daemon configuration can be changed in the `.env` and `docker-compose.yml` files.

### To Do
 - Orchestration
 - Clightning REST/RPC example
 - Add Clightning & Eclair configs to RTL
 - RGB protocol
 - Libbitcoin reference
 - Elements token creation and transaction scripts
 - Token swaps within Elements
 - Lightning swaps across Bitcoin and Elements
 - Other scripting examples

## How to run
Precompiled images will be downloaded from Docker Hub (see below for manual build instructions). From your terminal in this folder:

```
$ docker-compose up -d bitcoin electrs
# setup default wallet with predictable addresses
$ bin/stack bitcoin createwallet "default"
$ bin/stack bitcoin sethdseed true cSXteaZPxiDNEjtsgMhDKik5CL6YUc2hrEdkm51DrL85873UUFiQ
$ bin/stack bitcoin generate 101
$ docker-compose up -d alice bob frank

# Elements can be started optionally
$ docker-compose up -d elements
$ bin/stack elements generate 101

# Clightning can also be started on Bitcoin & Elements
$ docker-compose up -d carol dave emma
```

Check containers are up and running with:
```
$ docker-compose ps
```

Use the provided CLI tool to execute commands in the containers:
```
$ bin/stack bitcoin getwalletinfo
$ bin/stack elements getwalletinfo
$ bin/stack alice getinfo
$ bin/stack bob getinfo
$ bin/stack carol getinfo
$ bin/stack dave getinfo
$ bin/stack emma getinfo
$ bin/stack frank getinfo
```

Generate some bitcoin tx spam to enable smart fee estimation.
```
$ docker-compose up -d demo
$ docker-compose exec demo sh -c "node bitcoin-spam.js"
$ bin/stack bitcoin estimatesmartfee 24 ECONOMICAL
```

### Notification listener demo
Start following the demo subscriber node in a separate terminal window to see invoice messages as they come through.
```
$ docker-compose logs -f demo
$ bin/stack alice addinvoice 1000
```

### LND MPP to LND
A command is provided to easily create channels, so we can open some from `alice` to `bob` with some funding between the two `lnd` containers and do a multi part payment.
```
$ bin/stack alice channelto bob 5000000
$ bin/stack alice channelto bob 2000000
$ bin/stack alice channelto bob 500000
# once channels are opened a payment can be simulated
$ BOB_INVOICE=$(bin/stack bob addinvoice 5275000 | jq '.payment_request' | tr -d '"')
$ bin/stack alice payinvoice --max_parts=5 -f $BOB_INVOICE
$ bin/stack alice listchannels
$ bin/stack bob listchannels
```

### LND keysend to LND
The `bob` container is also configured to accept `keysend` transactions so payments can be made without requiring an invoice.
```
# assuming channel is opened as above
$ BOB_NODE=$(bin/stack bob getinfo | jq '.identity_pubkey' | tr -d '"')
$ bin/stack alice sendpayment --keysend $BOB_NODE 10000
```

### LND invoice payment to Clightning
Similar commands will connect `alice` & `bob` to `carol` across the `clightning` implementation of LN on Bitcoin.
```
$ bin/stack alice channelto carol 2000000
# open a 0.5BTC WUMBO channel
$ bin/stack bob channelto carol 50000000
# once channels are opened a payment can be simulated on a wumbo channel
$ CAROL_INVOICE=$(bin/stack carol invoice 4294967295msat "label1" "desc1" | jq '.bolt11' | tr -d '"')
$ bin/stack bob payinvoice -f $CAROL_INVOICE
$ bin/stack carol listfunds
```

### LND keysend payment to Clightning
You can also receive `keysend` payments to `clightning`:
```
# assuming channel is opened as above (might take a minute to sync & activate)
$ CAROL_NODE=$(bin/stack carol getinfo | jq '.id' | tr -d '"')
$ bin/stack bob sendpayment --keysend $CAROL_NODE 10000
```

### Clightning keysend to LND
Clightning keysend functionality to LND is not currently supported. See https://github.com/ElementsProject/lightning/issues/4299

### Clightning MPP to LND
Since 0.9.0 `clightning` supports MPP by default so payments are adaptively split into random amounts.
```
$ ALICE_INVOICE=$(bin/stack alice addinvoice 1000000 | jq '.payment_request' | tr -d '"')
$ bin/stack carol pay $ALICE_INVOICE
$ bin/stack alice lookupinvoice $(bin/stack alice decodepayreq $ALICE_INVOICE | jq '.payment_hash' | tr -d '"') | jq '.htlcs'
```

### Clightning plugin
A `clightning` plugin example is included for more advanced feature development.
```
$ bin/stack carol hello yourname
```

### Eclair invoice payment to Clightning
Similar commands will connect `frank` to `bob` from the `eclair` implementation of LN on Bitcoin.
```
$ bin/stack frank channelto bob 10000000
$ CAROL_INVOICE=$(bin/stack carol invoice 50000000msat "label2" "desc2" | jq '.bolt11' | tr -d '"')
$ bin/stack frank payinvoice --invoice=$CAROL_INVOICE
$ bin/stack frank audit
```

### Peg-in Bitcoin to Elements
Elements sidechain is available and can be pegged in from regtest Bitcoin chain using the provided script command.
```
$ bin/stack bitcoin pegin elements 13.37
$ bin/stack elements getwalletinfo
```

### Clightning payments on Elements
You can also open a LN **L-BTC** channel on `clightning` across the Elements chain between `dave` & `emma`!
```
# open a 0.5LBTC wumbo channel
$ bin/stack dave channelto emma 50000000
# this may take a minute to sync nodes & activate before channel has visible balance
# once channels are opened a payment can be simulated (max size 4294967295msat)
$ EMMA_INVOICE=$(bin/stack emma invoice 40000000msat "label1" "description1" | jq '.bolt11' | tr -d '"')
$ bin/stack dave pay $EMMA_INVOICE
$ bin/stack dave listpays
$ bin/stack emma listinvoices
```

### REST/RPC examples
REST/RPC queries can be executed directly from your application to each daemon. Use standard RPC adapters to connect to these and have full control over money flow; hook into message queues for notifications B).
```
#bitcoin
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://bitcoin:bitcoin@127.0.0.1:18889/

#elements
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://elements:elements@127.0.0.1:18886/

#lnd
$ ALICE_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T alice cat /home/lnd/.lnd/data/chain/bitcoin/regtest/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T alice cat /home/lnd/.lnd/tls.cert)" > ./alice-tls.cert
$ curl -XGET --cacert ./alice-tls.cert --header "$ALICE_MACAROON_HEADER" https://127.0.0.1:8090/v1/balance/channels

#eclair
$ curl -XPOST -u :password http://127.0.0.1:8110/getinfo

#clightning
Clightning exposes a JSON-RPC interface via a socket... example to follow..

#electrs
$ echo '{"jsonrpc":"2.0","method":"blockchain.block.header","id":"curltext","params":[0]}' | nc 127.0.0.1 50001
```

## RTL Admin
A [Ride-The-Lightning](https://github.com/Ride-The-Lightning/RTL) admin UI container is available. The interface is configured to monitor `alice` and `bob` by default and is available at `http://localhost:3000` with login password `rtl`.
```
$ docker-compose up -d rtl
```

## Other information
View daemon logs as follows:
```
$ docker-compose logs -f
```

When you are done you can destroy all running containers and volumes with:
```
$ docker-compose down -v
```

Images can be built locally using the following pattern:
```
$ docker build -t bitcoinstack/bitcoin:0.21.0-alpine ./bitcoin
```

---
@hashamadeus on Twitter
