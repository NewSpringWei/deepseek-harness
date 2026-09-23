<# Rasterize the deployment's installer art into the NSIS-embedded BMPs.

  Upstream's prepare-windows-installer.ps1 rasterizes its own assets from
  apps/desktop/installer/assets into the same output directory. This script runs
  afterwards and overwrites the five plates with the deployment's artwork, using the
  same geometry and background rule so the NSIS layout and the DWM frame need no change.

  The source PNGs in assets/ are the single source of truth for installer branding;
  replace them with real artwork at the same pixel dimensions and this script needs no edit.
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$assets = Join-Path $PSScriptRoot 'assets'
$output = [IO.Path]::GetFullPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $output)) { throw "installer-ui output directory is missing: $output" }
Add-Type -AssemblyName System.Drawing
foreach ($asset in @('brand', 'brand-2x', 'brand-dark', 'brand-dark-2x', 'uninstaller-sidebar')) {
    $source = Join-Path $assets "$asset.png"
    if (-not (Test-Path -LiteralPath $source)) { throw "installer brand asset is missing: $source" }
    $image = [Drawing.Image]::FromFile($source)
    try {
        $bitmap = [Drawing.Bitmap]::new($image.Width, $image.Height, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
        try {
            $graphics = [Drawing.Graphics]::FromImage($bitmap)
            try {
                # Matches upstream: the dark plates composite onto the installer's dark surface.
                $background = if ($asset -like '*dark*') { [Drawing.Color]::FromArgb(21, 21, 23) } else { [Drawing.Color]::White }
                $graphics.Clear($background)
                $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
            } finally { $graphics.Dispose() }
            $bitmap.Save((Join-Path $output "$asset.bmp"), [Drawing.Imaging.ImageFormat]::Bmp)
        } finally { $bitmap.Dispose() }
    } finally { $image.Dispose() }
}
Write-Output "Prepared deployment installer art: $output"
