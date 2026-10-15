// 슬라이드 스킬 2 덱 검사 · node check_deck.js <덱>.html [--total 900] [--shots <폴더>] [--sync]
// ① 1920×1080 · 1366×768 두 크기에서 장 넘침 · 깨진 그림
// ② presenterData: 장 id 와 원고 id 짝 · 표지 밖 모든 장에 핵심(key) · 배정 초 합계 = --total
// ③ --sync: 덱 창과 원고 창(?notes=1)이 같이 넘어가는지(작은 서버를 띄워 두 창으로 시험)
// ④ --shots: 1920×1080 장마다 스크린숏(눈 확인용)
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (_) { console.error('playwright 가 없음 · 먼저: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
const args = process.argv.slice(2);
const deck = args.find(a => a.endsWith('.html'));
if (!deck) { console.error('쓰는 법: node check_deck.js <덱>.html [--total 900] [--shots <폴더>] [--sync]'); process.exit(2); }
const opt = k => { const i = args.indexOf(k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const total = opt('--total') ? Number(opt('--total')) : null, shots = opt('--shots'), sync = !!opt('--sync');
const root = path.resolve(path.dirname(deck)), file = path.basename(deck);
const types = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' }); r.end(d); }); });
let bad = 0; const fail = m => { bad++; console.log('✗ ' + m); }, ok = m => console.log('○ ' + m);
srv.listen(0, async () => {
  const url = `http://localhost:${srv.address().port}/${file}`;
  const b = await pw.chromium.launch();
  try {
    for (const [w, h] of [[1920, 1080], [1366, 768]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(url); await p.waitForTimeout(2500);
      const r = await p.evaluate(() => {
        const over = [], broken = [];
        document.querySelectorAll('.slide').forEach((s, i) => { let maxB = 0, minT = 1e9; const top = s.getBoundingClientRect().top;
          s.querySelectorAll('*').forEach(el => { const q = el.getBoundingClientRect(); if (!q.height || getComputedStyle(el).position === 'absolute') return; maxB = Math.max(maxB, q.bottom - top); minT = Math.min(minT, q.top - top); });
          if (maxB > s.clientHeight - 8 || minT < 0) over.push(`${i + 1}. ${s.dataset.title} (${Math.round(minT)}~${Math.round(maxB)} / ${s.clientHeight})`); });
        document.querySelectorAll('img').forEach(i => { if (!i.complete || !i.naturalWidth) broken.push(i.getAttribute('src')); });
        document.querySelectorAll('.fig .none').forEach(d => broken.push(d.textContent));
        const el = document.getElementById('presenterData'); let notes = null; try { notes = el ? JSON.parse(el.textContent) : null; } catch (e) { notes = 'JSON 오류: ' + e.message; }
        return { n: document.querySelectorAll('.slide').length, ids: [...document.querySelectorAll('.slide')].map(s => s.id), keys: document.querySelectorAll('.slide .key').length, over, broken, notes };
      });
      r.over.length ? fail(`${w}×${h} 넘치는 장 ${r.over.length}: ${r.over.join(' · ')}`) : ok(`${w}×${h} 넘침 0 (${r.n}장)`);
      r.broken.length ? fail(`${w}×${h} 깨진 그림 ${r.broken.length}: ${r.broken.join(' · ')}`) : ok(`${w}×${h} 깨진 그림 0`);
      if (w === 1920) {
        if (!r.notes) fail('presenterData 없음'); else if (typeof r.notes === 'string') fail(r.notes); else {
          const nid = r.notes.map(x => x.id), miss = r.ids.filter(i => !nid.includes(i)), extra = nid.filter(i => !r.ids.includes(i));
          miss.length || extra.length ? fail(`원고 짝 어긋남 · 원고 없는 장 [${miss}] · 장 없는 원고 [${extra}]`) : ok(`원고 짝 ${nid.length}/${r.n}`);
          const noKey = r.notes.filter(x => x.id !== r.ids[0] && !x.key).map(x => x.id);
          noKey.length ? fail(`핵심 없는 장 [${noKey}]`) : ok(`오른쪽 핵심 칸 ${r.keys}장`);
          const sum = r.notes.reduce((a, x) => a + (x.seconds || 0), 0), mmss = s => Math.floor(s / 60) + '분 ' + (s % 60) + '초';
          total == null ? ok(`배정 합계 ${mmss(sum)}`) : sum === total ? ok(`배정 합계 ${mmss(sum)} = 목표`) : fail(`배정 합계 ${mmss(sum)} ≠ 목표 ${mmss(total)}`);
        }
        if (shots) { fs.mkdirSync(shots, { recursive: true });
          for (let i = 0; i < r.n; i++) { await p.evaluate(i => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelectorAll('.slide')[i].offsetTop); }, i);
            await p.waitForTimeout(120); await p.screenshot({ path: path.join(shots, 'shot_' + String(i + 1).padStart(2, '0') + '.png') }); }
          ok(`스크린숏 ${r.n}장 · ${shots}`); }
      }
      await p.close();
    }
    if (sync) {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
      const d = await ctx.newPage(); await d.goto(url); await d.waitForTimeout(1500);
      const n = await ctx.newPage(); await n.goto(url + '?notes=1'); await n.waitForTimeout(800);
      const pos = async () => [(await n.textContent('#nTitle')).split(' ')[0], (await d.textContent('#pg')).split(' ')[0]];
      await n.click('#nNextBtn'); await d.waitForTimeout(1200); const a = await pos();
      await d.keyboard.press('ArrowRight'); await d.waitForTimeout(1200); const c = await pos();
      a[0] === '2' && a[1] === '2' && c[0] === '3' && c[1] === '3' ? ok('원고 창 연동: 원고 창에서 넘김 · 덱 창에서 넘김 모두 같이 움직임') : fail(`원고 창 연동 어긋남 · 원고 창 넘김 뒤 ${a} · 덱 넘김 뒤 ${c}`);
      await ctx.close();
    }
  } finally { await b.close(); srv.close(); }
  console.log(bad ? `\n걸린 것 ${bad}건` : '\n깨끗함'); process.exit(bad ? 1 : 0);
});
