# Docker setup for Bitcoind & LND in regtest mode

### This is not suitable for production deployments. ONLY FOR DEVELOPMENT.

This `docker-compose` template launches `bitcoind`, and two `lnd` containers named `lndalice` and `lndbob`.

It is configured to run in **regtest** mode but can be modified to suit your needs.

### Notes
 - `docker` and `docker-compose` installation required (https://docs.docker.com/install/)
 - `bitcoind 0.18.0` is built from an Ubuntu repository and should not be used in production.
 - `lnd 0.7.0` containers will sync to chain after first Bitcoin regtest blocks are generated (see below).
 - Ports and other deamon configuration can be changed in the `.env` and `docker-compose.yml` files.

## How to run
It may take several minutes if containers need to be built. From your terminal in this folder:

```
$ docker-compose up -d bitcoind
$ bin/b-cli generate 101
$ docker-compose up -d lndalice lndbob
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

REST/RPC queries can be executed directly from the host to the daemons as follows:
```
#bitcoind
$ curl --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"getblockchaininfo","params":[]}' -H 'content-type:text/plain;' http://bitcoin:bitcoin@127.0.0.1:18889/

#lnd
$ ALICE_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T lndalice cat /shared/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T lndalice cat /shared/tls.cert)" > ./alice-tls.cert
$ BOB_MACAROON_HEADER="Grpc-Metadata-macaroon: `docker-compose exec -T lndbob cat /shared/admin.macaroon | xxd -ps -u -c 1000`"
$ echo "$(docker-compose exec -T lndbob cat /shared/tls.cert)" > ./bob-tls.cert
$ curl -XGET --cacert ./alice-tls.cert --header "$ALICE_MACAROON_HEADER" https://127.0.0.1:8080/v1/balance/channels
$ curl -XGET --cacert ./bob-tls.cert --header "$BOB_MACAROON_HEADER" https://127.0.0.1:8090/v1/balance/channels
```

View daemon logs as follows:
```
$ docker-compose logs -f bitcoind lndalice lndbob
```

When you are done you can destroy all running containers and volumes with:
```
$ docker-compose down -v
```

---
@hashamadeus on Twitter
