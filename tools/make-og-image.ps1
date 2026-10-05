# 링크 미리보기(카카오톡·메신저·SNS) 썸네일 1200x630 만들기
# 실행: powershell -ExecutionPolicy Bypass -File tools/make-og-image.ps1
# 원본: tools/og-image.html (글자·배치는 이 파일에서 고친다)
# 결과: assets/og-image.png (index.html의 og:image가 이 파일을 쓴다)
$root = Split-Path $PSScriptRoot -Parent
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome 또는 Edge가 필요해요' }

$src = 'file:///' + ((Join-Path $PSScriptRoot 'og-image.html') -replace '\\', '/')
$out = Join-Path $root 'assets/og-image.png'
# virtual-time-budget: 프리텐다드 웹폰트와 보석 이미지가 다 불러와질 때까지 기다린다
& $chrome --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files `
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 `
  "--screenshot=$out" $src | Out-Null
Write-Output "saved $out"
