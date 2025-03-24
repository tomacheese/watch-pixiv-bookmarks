#!/bin/sh

while :
do
  pnpm start || true

  # wait 5 minutes
  echo Waiting 5 minutes...
  sleep 300
done