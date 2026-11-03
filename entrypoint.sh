#!/bin/sh

# Exit code 10 means a permanent token failure, so retrying soon is pointless:
# the wait grows after each such failure.
wait=300

while :
do
  code=0
  pnpm start || code=$?

  if [ "$code" -eq 10 ]; then
    echo "Token refresh failed permanently. Waiting $wait seconds..."
    sleep "$wait"
    wait=$((wait * 2))
    [ "$wait" -gt 3600 ] && wait=3600
  else
    wait=300
    echo Waiting 5 minutes...
    sleep 300
  fi
done
