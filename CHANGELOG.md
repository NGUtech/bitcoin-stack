# Changelog

## 2020-08-15
 - Transfer repo to `NGUtech` (use `git remote set-url origin https://github.com/NGUtech/bitcoin-stack` to retarget local clones)
 - Update `clightning` to v0.9.0-1

## 2020-08-06
 - Add `RTL` v0.8.3 admin UI container with default configs for `alice` and `bob`

## 2020-08-04
 - Update `clightning` to v0.9.0 and add MPP example
 - Update `bitcoind` to v0.20.1

## 2020-07-22
 - Update `lnd` to v0.10.4-beta
 - Update `bitcoind` to v0.20.0
 - Update `eclair` to v0.4.1
 - Add bitcoin tx spam generator to demo app container to enable fee estimation

## 2020-05-22
 - Update `clightning` to v0.8.2.1

## 2020-05-05
 - Update `clightning` to v0.8.2

## 2020-04-30
 - Update `lnd` to v0.10.0-beta

## 2020-04-25
 - Update `elements` to v0.18.1.6
 - Adjust default ports

## 2020-04-21
 - Update `bitcoin` to v0.19.1
 - Update `lnd` to v0.9.2-beta, added `keysend` example
 - Update `eclair` to v0.3.4
 - Explicitly set `alpine` base images to v3.10

## 2020-03-05
 - Update `clightning` to v0.8.1
 - Update `lnd` to v0.9.1-beta
 - Update `eclair` to v0.3.3

## 2020-01-30
 - Update `lnd` to v0.9.0-beta

## 2019-12-19
 - Update `lnd` to v0.8.2-beta
 - Update `clightning` to v0.8.0 and update `stack` command to support new network specification
 - Update `bitcoin` to v0.19.0.1

## 2019-12-10
 - Removed deprecated rpc options from `bitcoin` & `elements` and added convenience `generate` command
 - Fix broken `pegin` stack command

## 2019-12-04
 - Add support to `clightning` image for `nodejs` plugins; `hello` example provided (h/t to @darosior for https://github.com/darosior/clightningjs)
 - Added some more ARM and ARM64 images to Docker hub

## 2019-12-02
 - Add extended rpc support to `lnd`, including hold invoice

## 2019-11-16 (breaking changes)
 - Fast deployment! Reorganised files & upload precompiled images to Docker hub
 - Update `bitcoin`, `elements` and `clightning` images to `alpine` linux reducing container size by 50-75%. (h/t to @ruipmarinho for https://github.com/ruimarinho/docker-bitcoin-core)

 - | Image | Size |
   | --- | --- |
   | bitcoin:0.18.1-alpine | 302MB |
   | elements:0.17.0.3-alpine | 182MB |
   | lnd:0.8.1-alpine | 77MB |
   | clightning:0.7.3-alpine | 219MB |
   | eclair:0.3.2 | 294MB |

 - Refactor node/container composition scripts
 - Add lightning node aliases

## 2019-11-13
 - Rename repo to `bitcoin-stack` (use `git remote set-url origin https://github.com/MrHash/bitcoin-stack` to retarget local clones)

## 2019-11-03
 - Add a app demo node listening to LND invoice events over secure GRPC

## 2019-10-30
 - Update `lightningd` to 0.7.3
 - Remove `lightningd-elements` now that `lightningd` 0.7.3 supports Elements/Liquid

## 2019-10-16
 - Update `lnd` to 0.8.0-beta and `go` version to 1.13
 - Update `elementsd` to 0.17.0.3 (`lightningd-elements` does not currently work with `elementsd` >= 0.18)
 - Update `eclair` to 0.3.2
 - Update `lightningd-elements` Dockerfile
 - Update schematic to show `elementsd` LN nodes specifically servicing the LBTC asset
 - Remove Docker host global port bindings

## 2019-09-28
 - Add headless `eclair` implementation on Bitcoin as `eclairdfrank`

## 2019-09-11
 - Add `lightningd-elements` WIP image build & two c-lightning nodes on Elements
 - Modify Ubuntu base versions in Docker images
 - Update `elementsd` image to 0.17.0.2
 - Fix Elements chain name for `elements-cli` calls from `lightningd`

## 2019-08-23
 - These changes may not be compatible with data volumes from previous builds
 - Update `bitcoind` image to 0.18.1, modified `configure` options
 - Update `lnd` image to 0.7.1-beta
 - Update `lightningd` image to 0.7.2.1
 - Update `elementsd` image to 0.17.0.1
 - Minor changes to `docker-compose` configuration

## 2019-07-04
 - `bitcoind` Dockerfile updated to allowing sharing of `bitcoin-cli` for `lightningd`
 - Added a `lightningd` node setup and tooling

## 2019-07-03
 - Replaced `bitcoind` Dockerfile with fully compiled version of 0.17.1 to match latest `elementsd` version
 - Added `elementsd` container configuration and tooling, compiled from source
 - Changed Ubuntu base containers to specific date version tag
 - Minor configuration tweaks
 - Add MPL2.0 license
 - Set pegin amount in convenience script

## 2019-07-02
 - Initial release
