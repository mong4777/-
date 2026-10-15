#!/usr/bin/env bash
# 맥 · 리눅스용 설치 스크립트: bash install.sh
set -e
cd "$(dirname "$0")"
DEST="$HOME/.claude/skills"
mkdir -p "$DEST"
cp -r html-slides slides2 "$DEST/"
echo "스킬 복사 완료: $DEST"

if command -v npm >/dev/null 2>&1; then
  cd "$DEST"
  [ -f package.json ] || npm init -y >/dev/null
  npm i playwright
  npx playwright install chromium
  echo "검사 도구(Playwright) 설치 완료"
else
  echo "Node.js가 없어 검사 도구는 건너뜀. https://nodejs.org 에서 설치 후 다시 실행하세요."
fi
echo "끝. 클로드 코드를 새로 켜고 「슬라이드 만들어」라고 해보세요."
