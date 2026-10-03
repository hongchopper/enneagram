# 링크 미리보기(카카오톡·메신저·SNS) 썸네일 1200x630 만들기
# 실행: powershell -ExecutionPolicy Bypass -File tools/make-og-image.ps1
# 결과: assets/og-image.png (index.html의 og:image가 이 파일을 쓴다)
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.TextRenderingHint = 'AntiAliasGridFit'

# 바탕: 흰색 → 연한 라벤더 (tokens.css --color-bg / --color-primary-soft)
$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')), ([System.Drawing.ColorTranslator]::FromHtml('#EEEAFD')), 90
$g.FillRectangle($bg, $rect)

# 보석 9개: 위 5개, 아래 4개 (오른쪽)
$gems = 'gem-1-sapphire','gem-2-rose-quartz','gem-3-diamond','gem-4-opal','gem-5-amethyst','gem-6-emerald','gem-7-citrine','gem-8-ruby','gem-9-aquamarine'
$size = 124; $gap = 4
$rows = @(@(0,1,2,3,4), @(5,6,7,8))
$right = $W - 64
$top = [int](($H - ($size * 2 + $gap)) / 2)
for ($r = 0; $r -lt 2; $r++) {
  $row = $rows[$r]
  $rowW = $row.Count * $size + ($row.Count - 1) * $gap
  $x = $right - $rowW - ($(if ($r -eq 1) { [int](($size + $gap) / 2) } else { 0 }))
  foreach ($i in $row) {
    $img = [System.Drawing.Image]::FromFile((Join-Path $root "assets/gems/$($gems[$i]).png"))
    $g.DrawImage($img, $x, $top + $r * ($size + $gap), $size, $size)
    $img.Dispose(); $x += $size + $gap
  }
}

# 글자 (NanumSquare — 사이트 본문 글꼴)
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile("$env:WINDIR\Fonts\NanumSquareEB.ttf")
$pfc.AddFontFile("$env:WINDIR\Fonts\NanumSquareR.ttf")
$eb = $pfc.Families | Where-Object { $_.Name -match 'ExtraBold' } | Select-Object -First 1
$rg = $pfc.Families | Where-Object { $_.Name -notmatch 'ExtraBold' } | Select-Object -First 1
$primary = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#6553C2'))
$text = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#3A3845'))
$px = [System.Drawing.GraphicsUnit]::Pixel
$g.DrawString('에니어그램', (New-Object System.Drawing.Font $rg, 30, $px), $primary, 72, 178)
$g.DrawString('내 보석 찾기', (New-Object System.Drawing.Font $eb, 72, $px), $text, 66, 222)
$g.DrawString("두 번만 고르면`n가장 가까운 유형의 보석을 보여줘요", (New-Object System.Drawing.Font $rg, 28, $px), $text, 72, 336)

$out = Join-Path $root 'assets/og-image.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $out"
