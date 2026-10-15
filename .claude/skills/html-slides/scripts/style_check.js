// 개조식 문체 검사기 · 슬라이드·보고서에 서술형 문장이 섞이지 않게 막음
//
// 잡는 것
//   본문 · 서술형 종결(…다 · …습니다) · 물음(…인가 · …나요) · 이어지는 어미(…면 · …고 · …며 · …지만)
//   제목 · 의문사 · 비유·수사 · 과장 강조어 · 대화체 도입구 · 문장 길이(36자·12어절 넘음)
//   인정하는 종결 · 명사형 -음/-함/-임 · 명사
//
// 쓰는 법
//   node style_check.js <파일…>              # .html · .js · .md (.md 는 줄 번호까지)
//   const style = require('./style_check.js'); style.assertFile(__filename);   # 생성기 맨 위에서 · 걸리면 멈춤
'use strict';
const fs = require('fs');

// ── 걸러낼 종결 ─────────────────────────────────────────
// 서술형 종결(…다) · 물음(…인가/…나요) · 이어지는 어미(…면/…고/…며/…지만)
const BAD = [
  { re: /다$/, why: '서술형 종결(…다)' },
  { re: /(인가|는가|을까|ㄹ까|나요|가요|까)$/, why: '물음' },
  { re: /(?<!하|가|어디|누구|무엇)나$/, why: '물음(…나)' },
  { re: /(으면|면)$/, why: '이어지는 어미(…면)' },
  { re: /(하고|되고|이고|지고)$/, why: '이어지는 어미(…고)' },
  { re: /(하며|이며|되며)$/, why: '이어지는 어미(…며)' },
  { re: /지만$/, why: '이어지는 어미(…지만)' },
  { re: /(습니다|입니다|합니다)$/, why: '경어 서술형' },
];
// 개조식으로 인정하는 종결 — 명사형 -음/-함/-임, 그 밖은 명사로 끝나야 한다
const OK_END = /(음|함|임|필요|불가|가능|완료|예정|중|무|유)$/;

// 문장 안에 있어도 서술형인 자리
const BAD_INNER = [
  { re: /[가-힣]다\s*[.·]/, why: '문장 가운데 서술형 종결' },
  { re: /[가-힣](한다|된다|있다|없다|난다|준다|온다|간다|든다|본다|쓴다|짓는다|남는다|바뀐다|줄어든다|없어진다)/, why: '서술형 동사' },
];

// 「…면」 으로 끝나는 명사 — 어미(…면)가 아니다(「확인 화면」 꼴)
const NOUN_MYEON = /(화면|장면|측면|반면|지면|표면|평면|단면|국면|전면|후면|양면|이면|수면|노면|벽면|방면|서면|도면|액면|정면|국면|해면|측면)$/;

const strip = s => String(s).trim()
  .replace(/^[※★●·\-–—\s]+/, '')
  .replace(/[.。!?…\s]+$/, '')
  .replace(/[)\]」』»】]+$/, '');

// ── 제목·소제목·카드 라벨 · 문장이 아니라 «이름표» ──
// 고쳐 쓸 말 예: 「무엇을, 어떻게 조사했는가」 → 「조사 방법」 · 「한 문장으로 요약하면」 → 「요약」 · 「가장 약한 고리」 → 「최저 영역」
const HEAD_BAD = [
  { re: /(무엇|무슨|어떻게|어떤|왜|어디|누가|누구|언제|얼마나|몇 )/, why: '의문사 — 제목은 물음이 아니라 이름표' },
  { re: /(얼굴|목소리|민낯|심장|고리|그림자|풍경|여정|첫걸음|이야기|한눈에|들여다|톺아|짚어|파헤|뒤집|살아 ?있)/, why: '비유·수사' },
  { re: /(가장|매우|아주|정말|압도적|획기적|반드시|완벽|절대적|놀라운|엄청|무려)/, why: '과장 강조어' },
  { re: /(한 문장으로|쉽게 말해|다시 말해|결론부터|이번 |우리는|우리가|그래서 |그러나 |하지만 )/, why: '대화체 도입구' },
  { re: /(라면|한다면|하더라도|해도 |지만 |아니라)/, why: '문장형 제목' },
  { re: /\s(하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열)$/, why: '수사 후치 — 「공백 둘」이 아니라 「공백 2건」' },
];
const HEAD_MAX_CHARS = 36;      // 제목이 길면 문장이다 — 공문서 장·절 제목(「제4장 협회 신고 기준액 및 4대보험 적용」)은 통과해야 한다
const HEAD_MAX_WORDS = 12;

function checkHeading(text) {
  const why = checkOne(text);
  if (why) return why;
  const s = strip(text).replace(/^\d+[.)]\s*/, '').replace(/^[ⅠⅡⅢⅣⅤⅥ][.)]\s*/, '');
  if (!s || !/[가-힣]/.test(s)) return null;
  // 「—」·「·」 로 이은 제목은 토막마다 본다 — 앞은 이름표, 뒤가 문장인 자리가 많다
  const parts = s.split(/\s*[—–]\s*/).filter(Boolean);
  if (parts.length > 1) { for (const p of parts) { const w = checkHeading(p); if (w) return w; } return null; }
  for (const b of HEAD_BAD) if (b.re.test(s)) return b.why;
  // 괄호는 원문에서 걷어 냄(끝 괄호를 먼저 떼면 짝이 깨짐)
  // 표식(⚠️ ★ ① 등)과 괄호는 어절·글자 수에서 뺀다 — 제목의 «말» 만 잰다
  const 본 = strip(String(text).replace(/\([^)]*\)/g, ' '))
    .replace(/[^가-힣A-Za-z0-9·\s.,~\-—–「」『』%]/g, ' ').trim();
  if (본.replace(/\s/g, '').length > HEAD_MAX_CHARS) return `제목이 문장 길이(${HEAD_MAX_CHARS}자 넘음)`;
  if (본.split(/\s+/).filter(Boolean).length > HEAD_MAX_WORDS) return `제목이 문장 길이(어절 ${HEAD_MAX_WORDS}개 넘음)`;
  return null;
}

// ── 표기 기준 — 공문서식으로 통일한다 ────────
//   날짜 「2026. 9. 17.」 · 세 자리 쉼표 「2,392명」 · 파일 이름과 시스템 값은 규칙 밖(260917·2026-09-17)
const NOTE_BAD = [
  { re: /\d{4}-\d{2}-\d{2}/, why: '날짜 표기 — 「2026. 9. 17.」 꼴로' },
  { re: /(?<![\d,.])\d{4}(?=\s*(명|원|건|개|부|회|가정|교회|시간|일))/, why: '세 자리 쉼표 누락 — 「2,392명」 꼴로' },
  { re: /(?<![\d,.])\d{5,}(?![\d,.%])/, why: '세 자리 쉼표 누락' },
];

function checkNotation(text) {
  const s = String(text);
  for (const b of NOTE_BAD) if (b.re.test(s)) return b.why;
  return null;
}

// ── .md 는 줄 단위로 본다 — visibleStrings 는 JS 소스용(따옴표 안만 뽑음)이라 .md 본문을 못 본다
function checkMarkdown(src) {
  const bad = [];
  let 코드안 = false;
  src.split('\n').forEach((raw, i) => {
    if (/^```/.test(raw.trim())) { 코드안 = !코드안; return; }
    if (코드안 || /^\s*>/.test(raw)) return;
    const 제목 = /^#+\s/.test(raw);
    const l = raw.replace(/`[^`]*`/g, ' ').replace(/^#+\s*/, '').replace(/^[-*+·★※]\s*/, '').trim();
    if (!l || /^\|?\s*[-:| ]+\|?$/.test(l)) return;
    const 칸 = l.startsWith('|') ? l.split('|').map(x => x.trim()).filter(Boolean) : [l];
    for (const c of 칸) {
      if (c.replace(/[^가-힣]/g, '').length < 2) continue;
      if (c.replace(/[「『][^」』]*[」』]/g, ' ').replace(/[^가-힣]/g, '').length === 0) continue;  // 인용뿐인 줄
      const why = 제목 ? checkHeading(c) : checkOne(c);
      if (why) bad.push({ line: i + 1, text: c.slice(0, 60), why });
    }
  });
  return bad;
}

function checkOne(text) {
  const s = strip(text);
  if (!s || !/[가-힣]/.test(s)) return null;
  for (const b of BAD_INNER) if (b.re.test(s)) return b.why;
  if (OK_END.test(s)) return null;
  for (const b of BAD) {
    if (!b.re.test(s)) continue;
    if (/면$/.test(s) && NOUN_MYEON.test(s)) continue;     // 명사 「…면」 은 어미가 아니다
    return b.why;
  }
  return null;
}

// ── 소스에서 «화면에 나가는 글»만 뽑는다 ────────────────
// 주석은 뺀다(주석은 사람이 읽는 자리라 서술형이어도 된다).
function stripCalls(src, names) {                     // console.log(…) 같은 호출을 통째로 지운다
  let out = src;
  names.forEach(n => {
    let i;
    while ((i = out.indexOf(n)) !== -1) {
      let j = out.indexOf('(', i);
      if (j === -1) { out = out.slice(0, i) + ' '.repeat(n.length) + out.slice(i + n.length); continue; }
      let depth = 0, k = j;
      for (; k < out.length; k++) {
        if (out[k] === '(') depth++;
        else if (out[k] === ')') { depth--; if (!depth) break; }
      }
      out = out.slice(0, i) + ' '.repeat(k - i + 1) + out.slice(k + 1);
    }
  });
  return out;
}

function visibleStrings(src) {
  const noComment = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map(l => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n')
    // 터미널에 뿌리는 말은 «보고서»가 아니다 — 규칙 밖에 둔다
    .replace(/console\.(log|error|warn|info)/g, 'CONSOLE_CALL');
  const out = [];
  const scanned = stripCalls(noComment, ['CONSOLE_CALL']);
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(scanned))) {
    const raw = m[2].replace(/\$\{[^}]*\}/g, ' ');   // ${…} 는 값이라 뺀다
    if (/[가-힣]/.test(raw)) out.push(raw);
  }
  return out;
}

// 소스 안의 «제목 자리» — 슬라이드·표의 제목은 본문보다 엄한 규칙을 탄다(2026-09-17).
//   생성기가 제목을 객체 값으로 들고 있으므로 그 열쇠 이름으로 찾는다.
const HEAD_KEY_RE = /\b(title|heading|head|h1|h2|h3|label|caption|제목|머리)\s*:\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g;

function visibleHeadings(src) {
  const out = [];
  let m;
  HEAD_KEY_RE.lastIndex = 0;
  while ((m = HEAD_KEY_RE.exec(src))) {
    const raw = m[3].replace(/\$\{[^}]*\}/g, ' ');
    if (/[가-힣]/.test(raw)) out.push(raw);
  }
  return out;
}

function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\.md$/i.test(file)) return checkMarkdown(src).map(b => ({ text: b.text, why: b.why, line: b.line }));
  const bad = [];
  const 제목들 = new Set(visibleHeadings(src));
  for (const s of visibleStrings(src)) {
    const why = 제목들.has(s) ? checkHeading(s) : checkOne(s);
    if (why) bad.push({ text: s.trim(), why });
  }
  return bad;
}

// 생성기 맨 위에서 부른다 — 걸리면 만들지 않고 멈춘다
function assertFile(file) {
  const bad = checkFile(file);
  if (!bad.length) return;
  console.error('\n❌ 개조식 규칙 위반 — 만들지 않고 멈춥니다\n');
  bad.forEach(b => console.error(`   「${b.text}」  ← ${b.why}`));
  console.error('\n   명사형으로 끝내십시오. 「…없어진다」→「사람 개입 불필요」, 「무엇이 만들어지고 있나」→「개발 현황」\n');
  process.exit(1);
}

module.exports = { checkOne, checkHeading, checkNotation, checkMarkdown, checkFile, assertFile, visibleStrings, visibleHeadings };

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('쓰는 법: node style_check.js <파일…>'); process.exit(2); }
  let n = 0;
  files.forEach(f => {
    const bad = checkFile(f);
    console.log(`\n${f} — ${bad.length ? `걸린 것 ${bad.length}개` : '깨끗함'}`);
    bad.forEach(b => { n++; console.log(`   ${b.line ? f + ':' + b.line + ' ' : ''}「${b.text}」  ← ${b.why}`); });
  });
  process.exit(n ? 1 : 0);
}
