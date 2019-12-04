# Changelog

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
 - Add a app subscriber node listening to LND invoice events over secure GRPC

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
