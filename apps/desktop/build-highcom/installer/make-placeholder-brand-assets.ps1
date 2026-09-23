<# One-off generator for the placeholder installer art in assets/.

  The company asset library holds only the 256x256 application icon, so these plates are
  composed from it plus the product name. They exist so a branded installer never renders
  upstream artwork. Replace assets/*.png with real design work at the same pixel dimensions
  and delete this script; prepare-brand-assets.ps1 keeps working unchanged.

  Dimensions are upstream's contract: the DWM frame draws the 1x plate at 600x196, and the
  uninstaller sidebar is 164x314.
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$assets = Join-Path $PSScriptRoot 'assets'
$icon = Join-Path $PSScriptRoot '..\icon.png'
$productName = 'Highcom Work'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
Add-Type -AssemblyName System.Drawing

function New-BrandPlate {
    param([int]$Width, [int]$Height, [double]$Scale, [bool]$Dark)
    $bitmap = [Drawing.Bitmap]::new($Width, $Height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear($(if ($Dark) { [Drawing.Color]::FromArgb(21, 21, 23) } else { [Drawing.Color]::White }))
    $iconSize = [int](96 * $Scale)
    $iconImage = [Drawing.Image]::FromFile($icon)
    try {
        $graphics.DrawImage($iconImage, [int](40 * $Scale), [int](($Height - $iconSize) / 2), $iconSize, $iconSize)
    } finally { $iconImage.Dispose() }
    $font = [Drawing.Font]::new('Segoe UI', [single](34 * $Scale), [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
    $brush = [Drawing.SolidBrush]::new($(if ($Dark) { [Drawing.Color]::FromArgb(249, 250, 251) } else { [Drawing.Color]::FromArgb(27, 27, 28) }))
    try {
        $textX = [int](40 * $Scale) + $iconSize + [int](28 * $Scale)
        $format = [Drawing.StringFormat]::new()
        $format.LineAlignment = [Drawing.StringAlignment]::Center
        $graphics.DrawString($productName, $font, $brush,
            [Drawing.RectangleF]::new($textX, 0, $Width - $textX - [int](16 * $Scale), $Height), $format)
    } finally { $brush.Dispose(); $font.Dispose(); $graphics.Dispose() }
    return $bitmap
}

foreach ($plate in @(
    @{ Name = 'brand'; Width = 600; Height = 196; Scale = 1.0; Dark = $false },
    @{ Name = 'brand-2x'; Width = 1200; Height = 392; Scale = 2.0; Dark = $false },
    @{ Name = 'brand-dark'; Width = 600; Height = 196; Scale = 1.0; Dark = $true },
    @{ Name = 'brand-dark-2x'; Width = 1200; Height = 392; Scale = 2.0; Dark = $true }
)) {
    $bitmap = New-BrandPlate -Width $plate.Width -Height $plate.Height -Scale $plate.Scale -Dark $plate.Dark
    try { $bitmap.Save((Join-Path $assets "$($plate.Name).png"), [Drawing.Imaging.ImageFormat]::Png) } finally { $bitmap.Dispose() }
}

$sidebar = [Drawing.Bitmap]::new(164, 314, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [Drawing.Graphics]::FromImage($sidebar)
$graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([Drawing.Color]::White)
$iconImage = [Drawing.Image]::FromFile($icon)
try { $graphics.DrawImage($iconImage, 22, 96, 120, 120) } finally { $iconImage.Dispose() }
$font = [Drawing.Font]::new('Segoe UI', [single]20, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$brush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(27, 27, 28))
$format = [Drawing.StringFormat]::new()
$format.Alignment = [Drawing.StringAlignment]::Center
try {
    $graphics.DrawString($productName, $font, $brush, [Drawing.RectangleF]::new(0, 224, 164, 60), $format)
} finally { $brush.Dispose(); $font.Dispose(); $graphics.Dispose() }
$sidebar.Save((Join-Path $assets 'uninstaller-sidebar.png'), [Drawing.Imaging.ImageFormat]::Png)
$sidebar.Dispose()
Write-Output "Wrote placeholder installer art to $assets"
