#!/bin/sh
set -e

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for elementsd"

  set -- elementsd "$@"
fi

if [ $(echo "$1" | cut -c1) = "-" ] || [ "$1" = "elementsd" ]; then
  mkdir -p "$ELEMENTS_DATA"
  chmod 700 "$ELEMENTS_DATA"
  chown -R elements "$ELEMENTS_DATA"

  echo "$0: setting data directory to $ELEMENTS_DATA"

  set -- "$@" -datadir="$ELEMENTS_DATA"
fi

if [ "$1" = "elementsd" ] || [ "$1" = "elements-cli" ] || [ "$1" = "elements-tx" ]; then
  echo
  exec su-exec elements "$@"
fi

echo
exec "$@"