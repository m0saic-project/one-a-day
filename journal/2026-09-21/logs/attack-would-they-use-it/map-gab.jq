.entries["Rust Benchmark"] | .[-2:] as $e
| ($e[0].benches | INDEX(.name)) as $b
| { rows: [ $e[1].benches[]
    | select($b[.name] != null)
    | { name: .name,
        unit: .unit,
        base:  $b[.name].value,
        value: .value,
        baseRange: ($b[.name].range),
        range: (.range) } ] }
