# Docker setup for Bitcoin, Elements/Liquid, & LND in regtest mode

### ONLY FOR DEVELOPMENT and TESTING. These tools may not be suitable for production deployments.

This `docker-compose` template launches `bitcoind`, two `lnd` containers named `lndalice` and `lndbob`, and optionally an `elementsd` side chain (aka Liquid).

It is configured to run in **regtest** mode but can be modified to suit your needs.

### Notes & prerequisites
 - `docker` and `docker-compose` installation is required (https://docs.docker.com/install/).
 - `jq` tool is used in examples for parsing json responses.
 - `lnd 0.7.0-beta` and `elementsd 0.17.0` will sync to chain after the first Bitcoin regtest blocks are generated.
  - All daemons are compiled from source but consider carefully before using them in production environments.
 - Ports and other daemon configuration can be changed in the `.env` and `docker-compose.yml` files.
 - See the [changelog](CHANGELOG.md) when upgrading.

## How to run
It may take up to 30 minutes to launch the stack if container images are not already compiled, since they are built from source. From your terminal in this folder:

```
$ docker-compose up -d bitcoind
$ bin/b-cli generate 101
$ docker-compose up -d lndalice lndbob
# elements can be started optionally
$ docker-compose up -d elementsd
$ bin/e-cli generate 1
```

Check containers are up and running with:
```
$ docker-compose ps
```

Use the provided cli tools to execute commands in the containers:
```
$ bin/b-cli getwalletinfo
$ bin/ln-alice getinfo
$ bin/ln-bob getinfo
```

A convenience script is provided to create a channel with some funding between the two `lnd` containers.
```
$ bin/ln-connect
# once channels are opened a payment can be simulated
$ TEST_INVOICE=$(bin/ln-alice addinvoice --amt 10000 | jq '.pay_req' | tr -d '"')
$ bin/ln-bob payinvoice $TEST_INVOICE
$ bin/ln-alice listchannels
$ bin/ln-bob listchannels
```

Elements sidechain is available and can be pegged in from dev bitcoin chain using the provided convenience script.
```
$ bin/e-pegin 1.337
$ bin/e-cli getwalletinfo
```

REST/RPC queries can be executed directly from the host to the daemons as follows:
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

#elementsd
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}' -H 'content-type:text/plain;' http://elements:elements@127.0.0.1:18886/
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
