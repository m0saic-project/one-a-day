#!/bin/sh
# Re-fetch the two raw inputs (not committed - 3MB each).
curl -sS -o gab-data.js https://raw.githubusercontent.com/benchmark-action/github-action-benchmark/gh-pages/dev/bench/data.js
sed 's/^window.BENCHMARK_DATA = //' gab-data.js > gab-data.json
# hyperfine.json here was produced by hyperfine 1.20.0 (x86_64-pc-windows-msvc) on this machine:
#   hyperfine --warmup 2 --runs 10 --export-json hyperfine.json '<cmd1>' '<cmd2>' '<cmd3>'
