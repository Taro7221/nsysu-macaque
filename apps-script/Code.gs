/**
 * 中山獼猴大作戰 — Google Apps Script 後端
 * 綁定在一份 Google 試算表上（擴充功能 → Apps Script），部署成「網頁應用程式」。
 *
 *  POST  (App 的 Web 元件)          → 寫入一筆遊戲紀錄
 *  GET   ?page=stats&player=暱稱     → 回傳戰績網頁（給 WebViewer 內嵌）
 *  GET   ?action=json&player=暱稱    → 回傳戰績 JSON（給 Web 元件讀數字用）
 */

const SHEET_NAME = '遊戲紀錄';
const HEADERS = ['時間', '玩家', '場景代碼', '場景', '射擊次數', '命中次數',
                 '命中率(%)', '最高連擊', '分數', '平均反應(ms)', '剩餘生命', '遊戲秒數'];
const SCENES = { cuiheng: '翠亨宿舍區', liberal: '文學院', milo: '米羅餐廳門口' };

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 寫入 =====
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const d = JSON.parse(e.postData.contents);
    if (d.type !== 'result') return json_({ ok: false, error: 'not a result' });

    const shots = Number(d.shots) || 0;
    const hits = Math.min(Number(d.hits) || 0, shots);
    const rate = shots ? Math.round(hits / shots * 1000) / 10 : 0;   // 由後端重新計算命中率
    const scene = SCENES[d.scene] ? d.scene : 'cuiheng';

    getSheet_().appendRow([
      new Date(),
      String(d.player || '訪客').slice(0, 30),
      scene,
      SCENES[scene],
      shots,
      hits,
      rate,
      Number(d.maxCombo) || 0,
      Number(d.score) || 0,
      Number(d.avgReactionMs) || 0,
      Number(d.livesLeft) || 0,
      Number(d.durationSec) || 0
    ]);
    return json_({ ok: true, hitRate: rate });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ===== 讀取 =====
function doGet(e) {
  const p = (e && e.parameter) || {};
  const player = String(p.player || '').slice(0, 30);

  if (p.action === 'json') return json_(buildStats_(player));

  if (p.page === 'stats') {
    const t = HtmlService.createTemplateFromFile('Stats');
    // 把 < 換掉，避免玩家名稱裡的字元破壞網頁裡的 <script>
    t.dataJson = JSON.stringify(buildStats_(player)).replace(/</g, '\\u003c');
    return t.evaluate()
      .setTitle('我的戰績')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return json_({ ok: true, message: '中山獼猴大作戰 API 運作中' });
}

/** 把試算表整理成戰績統計 */
function buildStats_(player) {
  const values = getSheet_().getDataRange().getValues().slice(1);   // 去掉標題列
  const rows = values.map(r => ({
    time: r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime(),
    player: String(r[1]), scene: String(r[2]),
    shots: Number(r[4]) || 0, hits: Number(r[5]) || 0, hitRate: Number(r[6]) || 0,
    maxCombo: Number(r[7]) || 0, score: Number(r[8]) || 0, avgReactionMs: Number(r[9]) || 0
  }));

  const mine = rows.filter(r => r.player === player).sort((a, b) => a.time - b.time);
  const sum = (arr, k) => arr.reduce((s, r) => s + r[k], 0);
  const totalShots = sum(mine, 'shots'), totalHits = sum(mine, 'hits');
  const reacted = mine.filter(r => r.avgReactionMs > 0);

  const byScene = Object.keys(SCENES).map(key => {
    const g = mine.filter(r => r.scene === key);
    const s = sum(g, 'shots'), h = sum(g, 'hits');
    return {
      key, name: SCENES[key], games: g.length,
      hitRate: s ? Math.round(h / s * 1000) / 10 : 0,
      bestCombo: g.length ? Math.max(...g.map(r => r.maxCombo)) : 0
    };
  });

  // 排行榜：每位玩家取最高分
  const best = {};
  rows.forEach(r => {
    if (!best[r.player] || r.score > best[r.player].score) best[r.player] = r;
  });
  const leaderboard = Object.values(best)
    .sort((a, b) => b.score - a.score).slice(0, 10)
    .map(r => ({ player: r.player, score: r.score, maxCombo: r.maxCombo, hitRate: r.hitRate }));

  return {
    player,
    games: mine.length,
    hitRate: totalShots ? Math.round(totalHits / totalShots * 1000) / 10 : 0,
    bestCombo: mine.length ? Math.max(...mine.map(r => r.maxCombo)) : 0,
    bestScore: mine.length ? Math.max(...mine.map(r => r.score)) : 0,
    avgReactionMs: reacted.length ? Math.round(sum(reacted, 'avgReactionMs') / reacted.length) : 0,
    recent: mine.slice(-10).map(r => ({
      time: r.time, scene: r.scene, hitRate: r.hitRate, maxCombo: r.maxCombo, score: r.score
    })),
    byScene,
    leaderboard
  };
}

/** 在 Apps Script 編輯器裡按「執行」可以塞一筆假資料測試 */
function testInsert() {
  doPost({ postData: { contents: JSON.stringify({
    type: 'result', player: '測試玩家', scene: 'milo',
    shots: 40, hits: 31, maxCombo: 12, score: 520, avgReactionMs: 640, livesLeft: 2, durationSec: 60
  }) } });
}
