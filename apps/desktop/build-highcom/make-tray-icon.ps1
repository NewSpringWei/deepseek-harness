<#
  Render the Windows tray bitmap from the deployment's application mark.

  Upstream ships scripts/render-tray-icon.ts, which renders resources/icon-windows.svg at
  seven sizes and is the source of resources/tray-windows.ico. This deployment cannot reuse
  that script: the SVG it reads is upstream's, and the deployment mark exists only as
  build-highcom/icon.png. The output name and the size list match upstream's, so the
  packaged layout and the shell read the same paths as before.

  Usage: powershell -NoProfile -ExecutionPolicy Bypass -File make-tray-icon.ps1
#>
[CmdletBinding()]
param(
  [string]$Source = (Join-Path $PSScriptRoot 'icon.png'),
  [string]$Target = (Join-Path $PSScriptRoot 'tray-windows.ico')
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Source)) { throw "tray icon source is missing: $Source" }

Add-Type -AssemblyName System.Drawing
# Upstream's size list; the shell hands the whole file to the OS, which picks a frame.
$sizes = @(16, 20, 24, 32, 40, 48, 64)
$frames = New-Object System.Collections.ArrayList
$image = [System.Drawing.Image]::FromFile($Source)
try {
  foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($image, 0, 0, $size, $size)
      } finally { $graphics.Dispose() }
      $stream = New-Object System.IO.MemoryStream
      try {
        # Windows Vista and later accept PNG-compressed frames, so no BMP re-encoding.
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        [void]$frames.Add(@{ Size = $size; Bytes = $stream.ToArray() })
      } finally { $stream.Dispose() }
    } finally { $bitmap.Dispose() }
  }
} finally { $image.Dispose() }

$output = [System.IO.File]::Create($Target)
try {
  $writer = New-Object System.IO.BinaryWriter($output)
  try {
    # ICONDIR, one ICONDIRENTRY per frame, then the PNG payloads.
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$frames.Count)
    $offset = 6 + 16 * $frames.Count
    foreach ($frame in $frames) {
      # 0 encodes 256; every size here is smaller, but the rule keeps the encoder honest.
      $dimension = [byte]$(if ($frame.Size -ge 256) { 0 } else { $frame.Size })
      $writer.Write($dimension)
      $writer.Write($dimension)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$frame.Bytes.Length)
      $writer.Write([UInt32]$offset)
      $offset += $frame.Bytes.Length
    }
    foreach ($frame in $frames) { $writer.Write($frame.Bytes) }
  } finally { $writer.Dispose() }
} finally { $output.Dispose() }
Write-Output "Rendered tray bitmap: $Target ($($frames.Count) frames)"
