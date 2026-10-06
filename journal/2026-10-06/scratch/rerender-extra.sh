#!/bin/sh
# Re-render variant a's stress cases from the final source (build call 2).
X=journal/2026-10-06/variants/a/extra
for c in "ten 1920 1080" "ten 1080 1080" "ten 1080 1920" "ten 1280 720" "ten 640 360" "empty 1080 1080" "empty 1920 1080" "long 1080 1920" "long 1080 1080" "long 1920 1080" "maxed 1080 1080" "maxed 480 270"; do
  set -- $c
  rm -f $X/$1-$2x$3.png
  m0saic make @one-a-day/community/weekly-run-report/v1 --template-repo . -w $2 -h $3 --props @$X/$1.props.json -o $X/$1-$2x$3.png > $X/$1-$2x$3.log 2>&1
  echo "$1 $2x$3 exit=$? $(grep -ci 'warn\|OVERLAY' $X/$1-$2x$3.log) warn-lines"
done
for c in "1080 1080" "3840 2160" "640 360" "480 270"; do
  set -- $c
  m0saic make @one-a-day/community/weekly-run-report/v1 --template-repo . -w $1 -h $2 -o $X/defaults-$1x$2.png > $X/defaults-$1x$2.log 2>&1
  echo "defaults $1x$2 exit=$?"
done
