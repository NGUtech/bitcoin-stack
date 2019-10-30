# Docker setup for Bitcoin, Elements/Liquid, LND, C-Lightning, & Eclair in regtest mode

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
L1:            |     BITCOIND     |╟-----------┴---╢|     ELEMENTSD    |
               |                  +-----------------+                  |
               └------------------┘                 └------------------┘
```

This `docker-compose` template launches `bitcoind`, two `lnd` containers named `lndalice` & `lndbob`, with a `lightningd` container as `lightningdcarol`, and an `eclair` container as `eclairdfrank`.

Additionally it can launch an `elementsd` sidechain (aka Liquid), with `lightningd` implementation containers as `lightningddave` & `lightningdemma` servicing the LBTC asset.

Everything is configured to run in **regtest** mode but can be adjusted as required.

## See the [changelog](CHANGELOG.md) before upgrading.

### Notes & prerequisites
 - `docker` and `docker-compose` installation is required (https://docs.docker.com/install/).
 - `jq` tool is used in examples for parsing json responses.
 - All nodes will sync to chain after the first Bitcoin & Elements regtest blocks are generated.
 - All daemons are compiled from source but it is not recommended to use them in production environments.
 - Ports and other daemon configuration can be changed in the `.env` and `docker-compose.yml` files.

### Coming soon
 - Elements token creation and transaction scripts
 - Token swaps within Elements
 - Lightning swaps across Bitcoin and Elements
 - Other scripting examples

## How to run
It may take up to 30 minutes to launch the stack if container images are not already compiled, since they are built from source. From your terminal in this folder:

```
$ docker-compose up -d bitcoind
$ bin/b-cli generate 101
$ docker-compose up -d lndalice lndbob
$ docker-compose up -d eclairdfrank

# Elements can be started optionally
$ docker-compose up -d elementsd
$ bin/e-cli generate 101

# lightningd can also be started on Bitcoin & Elements
$ docker-compose up -d lightningdcarol
$ docker-compose up -d lightningddave
$ docker-compose up -d lightningdemma
```

Check containers are up and running with:
```
$ docker-compose ps
```

Use the provided CLI tools to execute commands in the containers:
```
$ bin/b-cli getwalletinfo
$ bin/e-cli getwalletinfo
$ bin/ln-alice getinfo
$ bin/ln-bob getinfo
$ bin/ld-carol getinfo
$ bin/ld-dave getinfo
$ bin/ld-emma getinfo
$ bin/ed-frank getinfo
```

A convenience script is provided to create a channel from `bob` to `alice` with some funding between the two `lnd` containers.
```
$ bin/ln-connect
# once channels are opened a payment can be simulated
$ ALICE_INVOICE=$(bin/ln-alice addinvoice --amt 10000 | jq '.pay_req' | tr -d '"')
$ bin/ln-bob payinvoice $ALICE_INVOICE
$ bin/ln-alice listchannels
$ bin/ln-bob listchannels
```

Another convenience script will connect `bob` to `carol` across the `lightningd` implementation of LN on Bitcoin.
```
$ bin/ld-connect
# once channels are opened a payment can be simulated (note amount in *mSats*)
$ CAROL_INVOICE=$(bin/ld-carol invoice 10000000 "test" "" | jq '.bolt11' | tr -d '"')
$ bin/ln-bob payinvoice $CAROL_INVOICE
$ bin/ld-carol listfunds
```

A third script will connect `bob` to `frank` across the `eclair` implementation of LN on Bitcoin.
```
$ bin/ed-connect
# once channels are opened a payment can be simulated (note amount in *mSats*)
$ FRANK_INVOICE=$(bin/ed-frank createinvoice --amountMsat=10000000 --description="test" | jq '.serialized' | tr -d '"')
$ bin/ln-bob payinvoice $FRANK_INVOICE
$ bin/ed-frank audit
```

Elements sidechain is available and can be pegged in from regtest Bitcoin chain using the provided convenience script.
```
$ bin/e-pegin 13.37
$ bin/e-cli getwalletinfo
```

You can also open a LN LBTC channel on `lightningd` across the Elements chain between `dave` & `emma`.
```
$ bin/lde-connect
# once channels are opened a payment can be simulated (note amount in *mSats*)
$ EMMA_INVOICE=$(bin/ld-emma invoice 10000000 "test" "" | jq '.bolt11' | tr -d '"')
$ bin/ld-dave pay $EMMA_INVOICE
$ bin/ld-dave listpays
$ bin/ld-emma listinvoices
```

REST/RPC queries can be executed directly from your application to each daemon. Use standard RPC adapters to connect to these and have full control over money flow; hook into message queues for notifications B).
```
#bitcoind
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://bitcoin:bitcoin@127.0.0.1:18889/

#lnd
$ ALICE_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T lndalice cat /shared/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T lndalice cat /shared/tls.cert)" > ./alice-tls.cert
$ BOB_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T lndbob cat /shared/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T lndbob cat /shared/tls.cert)" > ./bob-tls.cert
$ curl -XGET --cacert ./alice-tls.cert --header "$ALICE_MACAROON_HEADER" https://127.0.0.1:8080/v1/balance/channels
$ curl -XGET --cacert ./bob-tls.cert --header "$BOB_MACAROON_HEADER" https://127.0.0.1:8090/v1/balance/channels

#eclair
$ curl -XPOST -u :password http://127.0.0.1:8100/getinfo

#elementsd
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://elements:elements@127.0.0.1:18886/

#lightningd
C-lightning doesn't have an RPC interface yet as far as i know, but the CLI wrapper is available in the bin folder.
```

View daemon logs as follows:
```
$ docker-compose logs -f
```

When you are done you can destroy all running containers and volumes with:
```
$ docker-compose down -v
```

---
@hashamadeus on Twitter
