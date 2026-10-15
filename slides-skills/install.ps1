# 윈도우 파워셸용 설치 스크립트: .\install.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$dest = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item -Recurse -Force html-slides, slides2 $dest
Write-Host "스킬 복사 완료: $dest"

if (Get-Command npm -ErrorAction SilentlyContinue) {
  Set-Location $dest
  if (-not (Test-Path package.json)) { npm init -y | Out-Null }
  npm i playwright
  npx playwright install chromium
  Write-Host "검사 도구(Playwright) 설치 완료"
} else {
  Write-Host "Node.js가 없어 검사 도구는 건너뜀. https://nodejs.org 에서 설치 후 다시 실행하세요."
}
Write-Host "끝. 클로드 코드를 새로 켜고 「슬라이드 만들어」라고 해보세요."
