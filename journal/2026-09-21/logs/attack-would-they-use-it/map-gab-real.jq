# github-action-benchmark data.js  ->  @one-a-day/dev/bench-delta/v1 props
#   usage: sed 's/^window.BENCHMARK_DATA = //' data.js \
#            | jq --arg suite "Rust Benchmark" -f map-gab-real.jq > props.json
# `range` is a STRING in the action's own data, and its dialect depends on the
# tool that produced it, so it has to be parsed, not renamed.
def spread($v):
  if . == null then null
  elif test("%") then ([scan("[0-9.]+")][0] | tonumber) * $v / 100
  elif test("stddev") then null
  elif test("[0-9]") then ([scan("[0-9.]+")][0] | tonumber)
  else null end;
.entries[$suite] | .[-2:] as $e
| ($e[0].benches | INDEX(.name)) as $b
| { title: ($e[0].commit.id[0:7] + " -> " + $e[1].commit.id[0:7]),
    baselineLabel: $e[0].commit.id[0:7],
    candidateLabel: $e[1].commit.id[0:7],
    smallerIsBetter: ($e[1].benches[0].unit | test("ops|iter/sec") | not),
    rows: [ $e[1].benches[]
      | . as $c
      | $b[$c.name] // empty
      | . as $p
      | select(($c.value > 0) and ($p.value > 0))
      | { name: $c.name,
          unit: ($c.unit | gsub("[ \t]+"; " ")),
          base:  $p.value,
          value: $c.value,
          baseRange: ($p.range | spread($p.value)),
          range:     ($c.range | spread($c.value)) }
      | with_entries(select(.value != null)) ] }
