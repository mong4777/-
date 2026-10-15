# 슬라이드 스킬 1 · 2 — 클로드 코드용

PPT 대신 **HTML 파일 하나**로 발표 덱을 짓는 클로드 코드 스킬 두 개.

| 스킬 | 폴더 | 부르는 말 | 결과 |
|---|---|---|---|
| 슬라이드 스킬 1 | `html-slides/` | 「슬라이드 만들어」·「강의 슬라이드」·「설교 슬라이드」 | 좌우로 넘기는 교육·강의·설교 덱 |
| 슬라이드 스킬 2 | `slides2/` | 「슬라이드 2로」·「발표자 원고 넣어」·「원고 창」 | 학술 발표 덱 · 오른쪽 핵심 칸 · 발표자 원고 · 노트북용 원고 창 · 발표 시간 맞춤 |

## 미리 보기

- `html-slides/templates/basic-deck.html` · `slides2/templates/poster-deck.html` 을 브라우저로 열기
- ← → 로 넘김 · H 띠 숨기기 · (스킬 2) P 원고 칸 · 오른쪽 아래 「원고 창」

## 설치

**모든 프로젝트에서 쓰기** — 두 폴더를 `~/.claude/skills/` 에 복사

```
# 맥 · 리눅스 · 터미널 · 이 README 가 있는 폴더에서
mkdir -p ~/.claude/skills
cp -r html-slides slides2 ~/.claude/skills/
```

```
# 윈도우 · 파워셸 · 이 README 가 있는 폴더에서
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse html-slides, slides2 "$env:USERPROFILE\.claude\skills\"
```

**한 프로젝트에서만 쓰기** — 그 프로젝트 안 `.claude/skills/` 에 복사

설치 뒤 클로드 코드를 새로 켜고 「슬라이드 만들어」라고 말하면 스킬이 걸림.

## 검사 도구 (선택)

넘침·깨진 그림·원고 짝·발표 시간을 자동으로 재려면 Node.js 와 Playwright 가 필요.

```
npm i -D playwright
npx playwright install chromium
node ~/.claude/skills/slides2/scripts/check_deck.js 내덱.html --total 900 --sync
node ~/.claude/skills/html-slides/scripts/style_check.js 내덱.html
```

## 들어 있는 것

```
html-slides/
  SKILL.md                     절차 · 문체 규칙 · 장 종류
  templates/basic-deck.html    견본 덱 10장
  scripts/style_check.js       개조식 문체 검사기
slides2/
  SKILL.md                     핵심 칸 · 발표자 원고 · 원고 창 절차
  templates/poster-deck.html   견본 덱 7장 · 3분
  templates/sample.svg         견본 그림
  scripts/check_deck.js        덱 검사기
```

## 문체 규칙 요점

- 제목은 문장이 아니라 **이름표**(「조사 방법」 ○ · 「무엇을 어떻게 조사했는가」 ✕)
- 본문은 개조식 명사형 · 줄표(—)·화살표(→) 대신 가운뎃점(·)
- 한 장에 메시지 하나
