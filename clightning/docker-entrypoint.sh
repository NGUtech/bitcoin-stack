#!/bin/sh
set -e

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lightningd"

  set -- lightningd "$@"
fi

if [ $(echo "$1" | cut -c1) = "-" ] || [ "$1" = "lightningd" ]; then
  mkdir -p "$CLIGHTNING_DATA"
  chmod 700 "$CLIGHTNING_DATA"
  chown -R clightning "$CLIGHTNING_DATA"

  echo "$0: setting data directory to $CLIGHTNING_DATA"

  set -- "$@" --lightning-dir="$CLIGHTNING_DATA"
fi

if [ "$1" = "lightningd" ] || [ "$1" = "lightning-cli" ]; then
  echo
  exec su-exec clightning "$@"
fi

echo
exec "$@"
