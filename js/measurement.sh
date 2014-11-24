#!/bin/bash
# use first parameter for receiving station
if [ "x$2" = "x" ]; then
  STATION='AB'
else
  STATION=$2
fi

if [ "x$1" != "x" ]; then
  PS=(1 10 50 100 150 197)
  count=0
  while [ "x${PS[count]}" != "x" ]
  do
    sudo ./elsa.js -l $1_${PS[count]}B -s $STATION ${PS[count]} &
    sleep 65
    echo "killing node process"
    sudo kill `pgrep node`
    sleep 2
    count=$(( $count + 1 ))
  done
else
  echo "please use sudo ./measurement.sh {LOGPREFIX} {RECEIVER}"
fi
