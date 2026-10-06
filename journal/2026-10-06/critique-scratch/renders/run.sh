#!/bin/sh
# usage: run.sh name WxH [WxH...]   (name "defaults" => no props)
D=journal/2026-10-06/critique-scratch/renders
name=$1; shift
for sz in "$@"; do
  w=${sz%x*}; h=${sz#*x}
  if [ "$name" = defaults ]; then P=""; else P="--props @$D/$name.props.json"; fi
  m0saic make @one-a-day/community/weekly-run-report/v1 --template-repo . -w $w -h $h $P -o $D/$name-$sz.png > $D/$name-$sz.log 2>&1
  echo "$name-$sz exit=$?"
done
