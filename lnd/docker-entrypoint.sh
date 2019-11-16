#!/bin/sh
set -e

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lnd"

  set -- lnd "$@"
fi

if [ $(echo "$1" | cut -c1) = "-" ] || [ "$1" = "lnd" ]; then
  mkdir -p "$LND_DATA"
  chmod 700 "$LND_DATA"
  chown -R lnd "$LND_DATA"

  echo "$0: setting data directory to $LND_DATA"

  set -- "$@" --lnddir="$LND_DATA"
fi

if [ "$1" = "lnd" ] || [ "$1" = "lncli" ]; then
  echo
  exec su-exec lnd "$@"
fi

echo
exec "$@"