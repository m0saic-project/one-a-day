# Scratch: pixel-probe the variant-a stills against the dumped lattice.
# The agent cannot view images; this samples the PNGs at the exact pip
# centers, the pace bar, the tile fill and the background, and counts ink
# pixels inside each text band. PASS/FAIL per claim.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = "C:\src\m0saic-production\one-a-day"
$variant = if ($args.Count -gt 0) { $args[0] } else { "a" }
$geom = Get-Content -Raw "$root\journal\2026-10-14\geom.json" | ConvertFrom-Json
$stills = @{
  landscape = "$root\journal\2026-10-14\variants\$variant\stills\landscape.png"
  portrait  = "$root\journal\2026-10-14\variants\$variant\stills\portrait.png"
  square    = "$root\journal\2026-10-14\variants\$variant\stills\square.png"
}
$minInk = @{
  "mark" = 400; "handle" = 80; "stat-strip" = 400; "tile-value-0" = 250; "tile-label-0" = 60
  "game-name-0" = 150; "game-name-9" = 100; "game-count-0" = 40; "footnote" = 300
}
function HexToColor($hex) {
  $r = [Convert]::ToInt32($hex.Substring(1, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(3, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(5, 2), 16)
  @{ r = $r; g = $g; b = $b }
}
function Near($c, $hex, $tol) {
  $e = HexToColor $hex
  [Math]::Abs($c.r - $e.r) -le $tol -and [Math]::Abs($c.g - $e.g) -le $tol -and [Math]::Abs($c.b - $e.b) -le $tol
}
$fail = 0
$lines = @()
# The why-tutorial's fifth page embeds the template at its defaults
# full-canvas; the chrome pages (problem, solution, usage) just need ink.
$g = $geom.tutorial
$bmp = [System.Drawing.Bitmap]::FromFile("$root\journal\2026-10-14\variants\$variant\stills\tutorial-5.png")
try {
  $bad = 0; $first = ""
  foreach ($pip in $g.pips) {
    $c = $bmp.GetPixel([int][Math]::Floor($pip.cx), [int][Math]::Floor($pip.cy))
    if (-not (Near $c $pip.color 14)) { $bad++; if ($first -eq "") { $first = "at $($pip.cx),$($pip.cy) got $($c.r),$($c.g),$($c.b) expect $($pip.color)" } }
  }
  if ($bad -gt 0) { $fail++; $lines += "FAIL tutorial-5 pips: $bad/100 off ($first)" } else { $lines += "PASS tutorial-5 pips: all 100 at the lattice (the template page)" }
  $c = $bmp.GetPixel([int]$g.paceBar.cx, [int]$g.paceBar.cy)
  if (-not (Near $c $g.accent 14)) { $fail++; $lines += "FAIL tutorial-5 pace bar" } else { $lines += "PASS tutorial-5 pace bar is accent" }
  $c = $bmp.GetPixel(4, 4)
  if (-not (Near $c $g.bg 10)) { $fail++; $lines += "FAIL tutorial-5 bg" } else { $lines += "PASS tutorial-5 page is the paper" }
} finally { $bmp.Dispose() }
foreach ($t in @("tutorial-2", "tutorial-3", "tutorial-4")) {
  $bmp = [System.Drawing.Bitmap]::FromFile("$root\journal\2026-10-14\variants\$variant\stills\$t.png")
  try {
    $ink = 0
    for ($y = 0; $y -lt $bmp.Height; $y += 4) {
      for ($x = 0; $x -lt $bmp.Width; $x += 4) {
        $c = $bmp.GetPixel($x, $y)
        if ((0.299 * $c.r + 0.587 * $c.g + 0.114 * $c.b) -lt 160) { $ink++ }
      }
    }
    if ($ink -lt 500) { $fail++; $lines += "FAIL ${t}: only $ink ink px - the page looks blank" } else { $lines += "PASS ${t}: $ink ink px - the page is drawn" }
  } finally { $bmp.Dispose() }
}
foreach ($name in @("landscape", "portrait", "square")) {
  $g = $geom.$name
  $bmp = [System.Drawing.Bitmap]::FromFile($stills[$name])
  try {
    # background: two corners are the page
    $bw = [int]$g.W - 5; $bh = [int]$g.H - 5
    foreach ($pt in @(@(4, 4), @($bw, $bh))) {
      $c = $bmp.GetPixel($pt[0], $pt[1])
      if (-not (Near $c $g.bg 10)) { $fail++; $lines += "FAIL $name bg at $($pt[0]),$($pt[1]) = $($c.r),$($c.g),$($c.b) expect $($g.bg)" }
    }
    # every pip center, its expected colour (a ring's hole is the page; its
    # stroke sample point sits mid-stroke on the horizontal radius)
    $bad = 0; $first = ""
    foreach ($pip in $g.pips) {
      $c = $bmp.GetPixel([int][Math]::Floor($pip.cx), [int][Math]::Floor($pip.cy))
      if (-not (Near $c $pip.color 14)) { $bad++; if ($first -eq "") { $first = "at $($pip.cx),$($pip.cy) got $($c.r),$($c.g),$($c.b) expect $($pip.color)" } }
      if ($pip.ring) {
        $c = $bmp.GetPixel([int][Math]::Floor($pip.ring.x), [int][Math]::Floor($pip.ring.y))
        if (-not (Near $c $pip.ring.color 14)) { $bad++; if ($first -eq "") { $first = "ring at $($pip.ring.x),$($pip.ring.y) got $($c.r),$($c.g),$($c.b) expect $($pip.ring.color)" } }
      }
    }
    if ($bad -gt 0) { $fail++; $lines += "FAIL $name pips: $bad off ($first)" } else { $lines += "PASS $name pips: all 100 at the lattice, filled accent / empty as drawn" }
    # pace bar, tile fill (when the variant has stat tiles)
    $c = $bmp.GetPixel([int]$g.paceBar.cx, [int]$g.paceBar.cy)
    if (-not (Near $c $g.accent 14)) { $fail++; $lines += "FAIL $name pace bar = $($c.r),$($c.g),$($c.b) expect $($g.accent)" } else { $lines += "PASS $name pace bar under the pace tile is accent" }
    if ($g.tile0Fill) {
      $c = $bmp.GetPixel([int]$g.tile0Fill.x, [int]$g.tile0Fill.y)
      if (-not (Near $c $g.tile0Fill.color 14)) { $fail++; $lines += "FAIL $name tile fill = $($c.r),$($c.g),$($c.b) expect $($g.tile0Fill.color)" } else { $lines += "PASS $name stat tile fill" }
    }
    # ink bands: text drew where the document says it drew
    foreach ($band in $g.inkBands) {
      $ink = 0
      $x0 = [int]$band.x; $x1 = [int]($band.x + $band.w); $y0 = [int]$band.y; $y1 = [int]($band.y + $band.h)
      for ($y = $y0; $y -lt $y1; $y += 2) {
        for ($x = $x0; $x -lt $x1; $x += 2) {
          $c = $bmp.GetPixel($x, $y)
          if ((0.299 * $c.r + 0.587 * $c.g + 0.114 * $c.b) -lt 160) { $ink++ }
        }
      }
      if ($ink -lt $minInk[$band.label]) { $fail++; $lines += "FAIL $name ink band $($band.label): $ink px (min $($minInk[$band.label]))" }
      else { $lines += "PASS $name ink band $($band.label): $ink px" }
    }
  } finally { $bmp.Dispose() }
}
$lines += "--- $fail failure(s)"
$lines | ForEach-Object { Write-Output $_ }
exit $(if ($fail -gt 0) { 1 } else { 0 })
