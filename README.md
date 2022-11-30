# Docker setup for Bitcoin, Elements/Liquid, LND, Clightning, Eclair, & Electrs in regtest mode

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

This `docker compose` template launches `bitcoin`, two `lnd` containers named `alice` & `bob`, with a `clightning` container as `carol`, and an `eclair` container as `frank`.

Additionally it can launch an `elements` sidechain (aka Liquid), with `clightning` implementation containers as `dave` & `emma` servicing the LBTC asset.

An application demo node is include which demonstrates how to connect to LND and listen to invoice messages and is able to generate transaction spam for fee estimation.

An `electrs` server is provided as another test app for exposing the Electrum protocol wrapper for `bitcoin`.

Everything is configured to run in **regtest** mode but can be adjusted as required. Images are provided for AMD64 and ARM64 architectures but you may have to manually build for others (see bottom).

## See the [changelog](CHANGELOG.md) before upgrading.

### Notes & prerequisites
 - `docker` with `compose` installation is required (https://docs.docker.com/install/).
 - `jq` tool is used in examples for parsing json responses.
 - All nodes will sync to chain after the first Bitcoin & Elements regtest blocks are generated.
 - Precompiled images are provided on Docker Hub but it is not recommended to use them in production environments.
 - Ports and other daemon configuration can be changed in the `.env` and `docker compose.yml` files.

### To Do
 - Orchestration
 - Clightning REST/RPC example
 - Add Clightning & Eclair configs to RTL
 - Taro/RGB protocols
 - Libbitcoin reference
 - Elements token creation and transaction scripts
 - Token swaps within Elements
 - Lightning swaps across Bitcoin and Elements
 - Trampoline routing example
 - Other scripting examples

## How to run
Precompiled images will be downloaded from Docker Hub (see below for manual build instructions). From your terminal in this folder:

```
$ docker compose up -d bitcoin electrs
# setup default wallet with predictable addresses
$ bin/stack bitcoin createwallet default
$ bin/stack bitcoin sethdseed true cSXteaZPxiDNEjtsgMhDKik5CL6YUc2hrEdkm51DrL85873UUFiQ
$ bin/stack bitcoin generate 101
$ docker compose up -d alice bob frank

# Elements can be started optionally
$ docker compose up -d elements
$ bin/stack elements createwallet default
$ bin/stack elements sethdseed true KyNW4F2XG6waxV7cvXq5PbyZwx5xUMxyWX1959hZ4jPPJaiTgm1r
$ bin/stack elements generate 101

# Clightning can also be started on Bitcoin & Elements
$ docker compose up -d carol dave emma
```

Check containers are up and running with:
```
$ docker compose ps
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
$ docker compose up -d demo
$ docker compose exec demo sh -c "node bitcoin-spam.js"
$ bin/stack bitcoin estimatesmartfee 24 ECONOMICAL
```

### Notification listener demo
Start following the demo subscriber node in a separate terminal window to see invoice messages as they come through.
```
$ docker compose logs -f demo
$ bin/stack alice addinvoice 1000
```

### LND AMP to LND
A command is provided to easily create channels, so we can open some from `alice` to `bob` with some funding between the two `lnd` containers and do an atomic multi-part (`amp`) payment. Alternatively you can use `max_parts` parameter.
```
$ bin/stack alice channelto bob 5000000
$ bin/stack alice channelto bob 2000000
$ bin/stack alice channelto bob 500000
# once channels are opened a payment can be simulated
$ BOB_INVOICE=$(bin/stack bob addinvoice 5275000 | jq -r '.payment_request')
$ bin/stack alice payinvoice --amp -f $BOB_INVOICE
$ bin/stack alice listchannels
$ bin/stack bob listchannels
```

### LND keysend to LND
The `bob` container is also configured to accept `keysend` transactions so payments can be made without requiring an invoice.
```
# assuming channel is opened as above
$ BOB_NODE=$(bin/stack bob getinfo | jq -r '.identity_pubkey')
$ bin/stack alice sendpayment --keysend --dest $BOB_NODE --amt 10000
```

### LND invoice payment to Clightning
Similar commands will connect `alice` & `bob` to `carol` across the `clightning` implementation of LN on Bitcoin.
```
$ bin/stack alice channelto carol 2000000
# open a 0.5BTC WUMBO channel
$ bin/stack bob channelto carol 50000000
# once channels are opened a payment can be simulated on a wumbo channel
$ CAROL_INVOICE=$(bin/stack carol invoice 4294967295msat "label1" "desc1" | jq -r '.bolt11')
$ bin/stack bob payinvoice -f $CAROL_INVOICE
$ bin/stack carol listfunds
```

### LND keysend payment to Clightning
You can also receive `keysend` payments to `clightning`:
```
# assuming channel is opened as above (might take a minute to sync & activate)
$ CAROL_NODE=$(bin/stack carol getinfo | jq -r '.id')
$ bin/stack bob sendpayment --keysend --dest $CAROL_NODE --amt 10000
```

### LND PSBT based channel creation
For this process we will use two terminal windows one for LND and one for Bitcoin PSBT processing.
```
# LND terminal
$ BOB_NODE=$(bin/stack bob getinfo | jq -r '.identity_pubkey')
$ bin/stack alice openchannel --node_key $BOB_NODE --local_amt 750000 --psbt
# Bitcoin terminal
$ bin/stack bitcoin walletcreatefundedpsbt '[]' '[{"<address chosen by lnd>":0.00750000}]' | jq -r '.psbt' > funded.psbt
$ docker cp funded.psbt "$(docker compose ps -q alice)":/funded.psbt
# LND terminal enter `/funded.psbt` as file path
# Bitcoin terminal signing round
$ bin/stack bitcoin walletprocesspsbt $(cat funded.psbt) | jq -r '.psbt' > signed.psbt
# docker cp signed.psbt "$(docker compose ps -q alice)":/signed.psbt
# > LND terminal enter `/signed.psbt` as file path
$ bin/stack bitcoin generate 3
$ bin/stack alice listchannels
```

### Clightning keysend to LND
Now `clightning` interoperates with `lnd` using `keysend`
```
$ BOB_NODE=$(bin/stack bob getinfo | jq -r '.identity_pubkey')
$ bin/stack carol keysend $BOB_NODE 2000000
```

### Clightning MPP to LND
`clightning` supports MPP by default so payments are adaptively split into random amounts.
```
$ ALICE_INVOICE=$(bin/stack alice addinvoice 1000000 | jq -r '.payment_request')
$ bin/stack carol pay $ALICE_INVOICE
$ bin/stack alice lookupinvoice $(bin/stack alice decodepayreq $ALICE_INVOICE | jq -r '.payment_hash') | jq '.htlcs'
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
$ CAROL_INVOICE=$(bin/stack carol invoice 50000000msat "label2" "desc2" | jq -r '.bolt11')
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
$ EMMA_INVOICE=$(bin/stack emma invoice 40000000msat "label1" "description1" | jq -r '.bolt11')
$ bin/stack dave pay $EMMA_INVOICE
$ EMMA_NODE=$(bin/stack emma getinfo | jq -r '.id')
$ bin/stack dave keysend $EMMA_NODE 25000000
$ bin/stack dave listpays
$ bin/stack emma listinvoices
```

### REST/RPC examples
REST/RPC queries can be executed directly from your application to each daemon. Use standard RPC adapters to connect to these and have full control over money flow; hook into message queues for notifications B).
```
# bitcoin
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://bitcoin:bitcoin@127.0.0.1:18889/

# elements
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://elements:elements@127.0.0.1:18886/

# lnd
$ ALICE_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker compose exec -T alice cat /home/lnd/.lnd/data/chain/bitcoin/regtest/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker compose exec -T alice cat /home/lnd/.lnd/tls.cert)" > ./alice-tls.cert
$ curl -XGET --cacert ./alice-tls.cert --header "$ALICE_MACAROON_HEADER" https://127.0.0.1:8090/v1/balance/channels

# eclair
$ curl -XPOST -u :password http://127.0.0.1:8110/getinfo

# clightning
Clightning exposes a JSON-RPC interface via a socket... example to follow..

# electrs
$ echo '{"jsonrpc":"2.0","method":"blockchain.block.header","id":"curltext","params":[0]}' | nc 127.0.0.1 50001
```

## RTL Admin
A [Ride-The-Lightning](https://github.com/Ride-The-Lightning/RTL) admin UI container is available. The interface is configured to monitor `alice` and `bob` by default and is available at `http://localhost:3000` with login password `rtl`.
```
$ docker compose up -d rtl
```

## Other information
View daemon logs as follows:
```
$ docker compose logs -f
```

When you are done you can destroy all running containers and volumes with:
```
$ docker compose down -v
```

Single architecture images can be built locally as follows:
```
$ docker build --build-arg BITCOIN_VERSION=23.0 -t bitcoinstack/bitcoin:23.0-alpine ./bitcoin
```

Multi-architecture images can be built locally using the following commands:
```
$ docker buildx create --name bitcoinstack --platform linux/amd64,linux/arm64
$ docker buildx build --builder bitcoinstack --platform linux/amd64,linux/arm64 --build-arg BITCOIN_VERSION=22.0 -t bitcoinstack/bitcoin:22.0-alpine ./bitcoin
```

---
@hashamadeus on Twitter
