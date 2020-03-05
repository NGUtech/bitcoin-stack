# Docker setup for Bitcoin, Elements/Liquid, LND, Clightning, & Eclair in regtest mode

### ONLY FOR DEVELOPMENT and TESTING. These tools may not be suitable for production deployments.


```
     ┌--------------------------------------------------------------------┐
L+:  |                      YOUR APPLICATION STACK                        |
     └---------------------------------+-------+--------------------------┘
                                       |       |
                    ┌---------┐        |       |
                    |         |        |       |
                    |  FRANK  |╟-------┤       ├------┐
                    |         |        |       |      |
                    └----+----┘        |       |      |
                         |             ╧       |      ╧
     ┌-----------┐  ┌----+----┐  ┌-----------┐ | ┌----------┐  ┌----------┐
     |           |  |         |  |           | | |          |  |          |
L2:  |   ALICE   +--+   BOB   +--+   CAROL   | | |   DAVE   +--+   EMMA   |
     |           |  |         |  |           | | |          |  |          |
     └-----+-----┘  └----+----┘  └-----+-----┘ | └----+-----┘  └-----+----┘
           |             |             |       |      |              |
           |             |             |       |     ┌+--------------+┐
           |             |             |       |     |      LBTC      |
           |             |             |       |     └+--------------+┘
           |             |             |       |      |              |
           |   ┌---------+--------┐    |       |    ┌-+--------------+-┐
           └---+                  +----┘       |    |                  |
L1:            |     BITCOIN      |╟-----------┴---╢|     ELEMENTS     |
               |                  +-----------------+                  |
               └------------------┘                 └------------------┘
```

This `docker-compose` template launches `bitcoin`, two `lnd` containers named `alice` & `bob`, with a `clightning` container as `carol`, and an `eclair` container as `frank`.

Additionally it can launch an `elements` sidechain (aka Liquid), with `clightning` implementation containers as `dave` & `emma` servicing the LBTC asset.

An application subscriber node is include which demonstrates how to connect to LND and listen to invoice messages.

Everything is configured to run in **regtest** mode but can be adjusted as required.

## See the [changelog](CHANGELOG.md) before upgrading.

### Notes & prerequisites
 - `docker` and `docker-compose` installation is required (https://docs.docker.com/install/).
 - `jq` tool is used in examples for parsing json responses.
 - All nodes will sync to chain after the first Bitcoin & Elements regtest blocks are generated.
 - Precompiled images are provided on Docker Hub but it is not recommended to use them in production environments.
 - Ports and other daemon configuration can be changed in the `.env` and `docker-compose.yml` files.

### Coming soon
 - Orchestration
 - Clightning RPC example
 - Elements token creation and transaction scripts
 - Token swaps within Elements
 - Lightning swaps across Bitcoin and Elements
 - Other scripting examples

## How to run
Precompiled images will be downloaded from Docker Hub (see below for manual build instructions). From your terminal in this folder:

```
$ docker-compose up -d bitcoin
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

Start following the subscriber node in a separate terminal window to see invoice messages as they come through.
```
$ docker-compose up -d subscriber
$ docker-compose logs -f subscriber
$ bin/stack alice addinvoice 1000
```

A command is provided to create a channel from `alice` to `bob` with some funding between the two `lnd` containers.
```
$ bin/stack alice channelto bob 10000000
# once channels are opened a payment can be simulated
$ BOB_INVOICE=$(bin/stack bob addinvoice 100000 | jq '.payment_request' | tr -d '"')
$ bin/stack alice payinvoice -f $BOB_INVOICE
$ bin/stack alice listchannels
$ bin/stack bob listchannels
```

A similar command will connect `bob` to `carol` across the `clightning` implementation of LN on Bitcoin.
```
$ bin/stack bob channelto carol 10000000
# once channels are opened a payment can be simulated (note amount in *mSats*)
$ CAROL_INVOICE=$(bin/stack carol invoice 100000000 "label1" "description1" | jq '.bolt11' | tr -d '"')
$ bin/stack bob payinvoice -f $CAROL_INVOICE
$ bin/stack carol listfunds
# test the example plugin with the following:
$ bin/stack carol hello yourname
```

The same command will connect `bob` to `frank` across the `eclair` implementation of LN on Bitcoin.
```
$ bin/stack bob channelto frank 10000000
# once channels are opened a payment can be simulated (note amount in *mSats*)
$ FRANK_INVOICE=$(bin/stack frank createinvoice --amountMsat=100000000 --description="test" | jq '.serialized' | tr -d '"')
$ bin/stack bob payinvoice -f $FRANK_INVOICE
$ bin/stack frank audit
```

Elements sidechain is available and can be pegged in from regtest Bitcoin chain using the provided script command.
```
$ bin/stack bitcoin pegin elements 13.37
$ bin/stack elements getwalletinfo
```

You can also open a LN **L-BTC** channel on `clightning` across the Elements chain between `dave` & `emma`.
```
$ bin/stack dave channelto emma 10000000
# this may take upto a minute to sync with chain before channel has visible balance
# once channels are opened a payment can be simulated (note amount explicitly specified as *sat*)
$ EMMA_INVOICE=$(bin/stack emma invoice 100000sat "label1" "description1" | jq '.bolt11' | tr -d '"')
$ bin/stack dave pay $EMMA_INVOICE
$ bin/stack dave listpays
$ bin/stack emma listinvoices
```

REST/RPC queries can be executed directly from your application to each daemon. Use standard RPC adapters to connect to these and have full control over money flow; hook into message queues for notifications B).
```
#bitcoin
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://bitcoin:bitcoin@127.0.0.1:18889/

#elements
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://elements:elements@127.0.0.1:18886/

#lnd
$ ALICE_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T alice cat /home/lnd/.lnd/data/chain/bitcoin/regtest/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T alice cat /home/lnd/.lnd/tls.cert)" > ./alice-tls.cert
$ curl -XGET --cacert ./alice-tls.cert --header "$ALICE_MACAROON_HEADER" https://127.0.0.1:8080/v1/balance/channels

#eclair
$ curl -XPOST -u :password http://127.0.0.1:8100/getinfo

#clightning
Clightning exposes a JSON-RPC interface via a socket... example to follow..
```

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
$ docker build -t bitcoinstack/bitcoin:0.18.1-alpine ./bitcoin
```

---
@hashamadeus on Twitter
