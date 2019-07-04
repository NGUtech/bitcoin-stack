# Changelog

## 2019-07-04
 - `bitcoind` Dockerfile updated to allowing sharing of `bitcoin-cli` for `lightningd`.
 - Added a `lightningd` node setup and tooling.

## 2019-07-03
 - Replaced `bitcoind` Dockerfile with fully compiled version of 0.17.1 to match latest `elementsd` version.
 - Added `elementsd` container configuration and tooling, compiled from source.
 - Changed Ubuntu base containers to specific date version tag.
 - Minor configuration tweaks.
 - Add MPL2.0 license.
 - Set pegin amount in convenience script

## 2019-07-02
 - Initial release.