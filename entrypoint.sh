#!/bin/sh

# 終了コード 10 は pixiv トークン更新の恒久的な失敗 (HTTP 400/401) を表す。
# この場合は 5 分固定ではなく、待機時間を最大 1 時間まで段階的に延ばす。
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
