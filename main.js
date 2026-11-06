// ==UserScript==
// @name         AeroChrono — GeoFS Flight Timer Console
// @namespace    https://github.com/zssszscnplane/GeoFS-Cabin-Sounds-addon
// @version      2.1.0
// @description  GeoFS 飞行计时器：必须输入起降机场才能开始，带控制台、暂停/继续/重置、拖拽、localStorage 记忆，以及 .json 导入/导出。
// @author       zssszscnplane
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'geofs_flight_timer_v2';

  // ---------- 注入样式 ----------
  const style = document.createElement('style');
  style.textContent = `
    #gft-card {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 999999;
      width: 300px;
      max-width: calc(100vw - 32px);
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.06);
      color: #e2e8f0;
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
      font-size: 13px;
      overflow: hidden;
      user-select: none;
      transition: box-shadow 0.2s ease;
    }
    #gft-card:hover {
      box-shadow: 0 16px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    #gft-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(59, 130, 246, 0.08));
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      cursor: grab;
    }
    #gft-header:active { cursor: grabbing; }
    #gft-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      letter-spacing: 0.3px;
      color: #f1f5f9;
      pointer-events: none;
    }
    #gft-title .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22d3ee;
      box-shadow: 0 0 8px #22d3ee;
      animation: gft-pulse 2s infinite;
    }
    @keyframes gft-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    #gft-toggle {
      font-size: 12px;
      color: #94a3b8;
      transition: transform 0.25s ease;
      pointer-events: none;
    }
    #gft-card.collapsed #gft-toggle { transform: rotate(-90deg); }
    #gft-card.collapsed #gft-body { max-height: 0; opacity: 0; }
    #gft-body {
      max-height: 640px;
      opacity: 1;
      overflow: hidden;
      transition: max-height 0.3s ease, opacity 0.25s ease;
    }
    #gft-route {
      padding: 10px 14px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: 'Consolas', 'SF Mono', monospace;
      font-size: 15px;
      letter-spacing: 1px;
      color: #7dd3fc;
    }
    #gft-route .arrow { color: #64748b; }
    #gft-route .empty { color: #475569; font-size: 13px; letter-spacing: 0; }
    #gft-clock {
      text-align: center;
      padding: 8px 14px 4px;
      font-family: 'Consolas', 'SF Mono', monospace;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #4ade80;
      text-shadow: 0 0 18px rgba(74, 222, 128, 0.45);
      transition: color 0.2s ease, text-shadow 0.2s ease;
    }
    #gft-clock.running { color: #22d3ee; text-shadow: 0 0 18px rgba(34, 211, 238, 0.55); }
    #gft-clock.paused { color: #fbbf24; text-shadow: 0 0 18px rgba(251, 191, 36, 0.45); }
    #gft-controls {
      display: flex;
      gap: 8px;
      padding: 8px 14px 8px;
    }
    .gft-btn {
      flex: 1;
      padding: 8px 0;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s ease, filter 0.15s ease;
      font-family: inherit;
    }
    .gft-btn:active { transform: scale(0.97); }
    .gft-btn-primary {
      background: linear-gradient(135deg, #22d3ee, #3b82f6);
      color: #001018;
      box-shadow: 0 4px 14px rgba(34, 211, 238, 0.3);
    }
    .gft-btn-primary:hover { filter: brightness(1.1); }
    .gft-btn-primary.stop {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: #fff;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
    }
    .gft-btn-ghost {
      background: rgba(148, 163, 184, 0.12);
      color: #cbd5e1;
    }
    .gft-btn-ghost:hover { background: rgba(148, 163, 184, 0.2); }
    #gft-file-row {
      display: flex;
      gap: 8px;
      padding: 0 14px 12px;
    }
    .gft-btn-file {
      flex: 1;
      padding: 7px 0;
      border: 1px dashed rgba(148, 163, 184, 0.3);
      border-radius: 8px;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .gft-btn-file:hover {
      border-color: #22d3ee;
      color: #22d3ee;
      background: rgba(34, 211, 238, 0.05);
    }
    #gft-settings {
      padding: 12px 14px 14px;
      border-top: 1px dashed rgba(148, 163, 184, 0.15);
    }
    .gft-field {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .gft-field label {
      flex: 0 0 70px;
      color: #94a3b8;
      font-size: 12px;
    }
    .gft-input {
      flex: 1;
      padding: 7px 10px;
      border-radius: 7px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(2, 6, 23, 0.6);
      color: #f1f5f9;
      font-family: 'Consolas', 'SF Mono', monospace;
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .gft-input:focus {
      border-color: #22d3ee;
      box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.15);
    }
    .gft-input.invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
    }
    #gft-log {
      margin-top: 10px;
      height: 90px;
      overflow-y: auto;
      background: rgba(2, 6, 23, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 8px;
      padding: 8px 10px;
      font-family: 'Consolas', 'SF Mono', monospace;
      font-size: 11px;
      line-height: 1.6;
      color: #94a3b8;
      scrollbar-width: thin;
    }
    #gft-log::-webkit-scrollbar { width: 6px; }
    #gft-log::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.25); border-radius: 3px; }
    #gft-log .line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #gft-log .time { color: #475569; margin-right: 6px; }
    #gft-log .ok { color: #4ade80; }
    #gft-log .warn { color: #fbbf24; }
    #gft-log .err { color: #f87171; }
    #gft-log .info { color: #22d3ee; }
  `;
  document.head.appendChild(style);

  // ---------- DOM ----------
  const card = document.createElement('div');
  card.id = 'gft-card';
  card.innerHTML = `
    <div id="gft-header">
      <div id="gft-title"><span class="dot"></span>AeroChrono</div>
      <div id="gft-toggle">▼</div>
    </div>
    <div id="gft-body">
      <div id="gft-route"><span class="empty">未设置航线</span></div>
      <div id="gft-clock">00:00:00</div>
      <div id="gft-controls">
        <button class="gft-btn gft-btn-primary" id="gft-start">开始</button>
        <button class="gft-btn gft-btn-ghost" id="gft-reset">重置</button>
      </div>
      <div id="gft-file-row">
        <button class="gft-btn-file" id="gft-export">导出 .json</button>
        <button class="gft-btn-file" id="gft-import">导入 .json</button>
        <input type="file" id="gft-import-file" accept=".json,application/json" style="display:none">
      </div>
      <div id="gft-settings">
        <div class="gft-field">
          <label>起飞机场</label>
          <input class="gft-input" id="gft-dep" maxlength="4" placeholder="ZSPD" autocomplete="off" spellcheck="false">
        </div>
        <div class="gft-field">
          <label>落地机场</label>
          <input class="gft-input" id="gft-arr" maxlength="4" placeholder="ZSSS" autocomplete="off" spellcheck="false">
        </div>
        <div id="gft-log"></div>
      </div>
    </div>
  `;
  document.body.appendChild(card);

  // ---------- 元素引用 ----------
  const $ = (id) => card.querySelector('#' + id);
  const headerEl = $('gft-header');
  const clockEl = $('gft-clock');
  const routeEl = $('gft-route');
  const startBtn = $('gft-start');
  const resetBtn = $('gft-reset');
  const exportBtn = $('gft-export');
  const importBtn = $('gft-import');
  const importFile = $('gft-import-file');
  const depInput = $('gft-dep');
  const arrInput = $('gft-arr');
  const logEl = $('gft-log');

  // ---------- 状态 ----------
  let state = 'idle'; // idle | running | paused
  let startTime = 0;
  let elapsed = 0;
  let timerId = null;
  let logEntries = [];

  // ---------- 工具 ----------
  const pad = (n) => String(n).padStart(2, '0');

  function fmt(ms) {
    const t = Math.floor(ms / 1000);
    return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  }

  function nowStamp() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function log(msg, type = '') {
    const stamp = nowStamp();
    logEntries.push({ time: stamp, level: type, message: msg });
    while (logEntries.length > 60) logEntries.shift();

    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = `<span class="time">[${stamp}]</span><span class="${type}">${escapeHtml(msg)}</span>`;
    logEl.appendChild(line);
    while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function validIcao(code) {
    return /^[A-Z0-9]{4}$/.test(code);
  }

  function readAirports() {
    return {
      dep: depInput.value.trim().toUpperCase(),
      arr: arrInput.value.trim().toUpperCase(),
    };
  }

  function updateRouteDisplay() {
    const { dep, arr } = readAirports();
    if (dep && arr) {
      routeEl.innerHTML = `<span>${escapeHtml(dep)}</span><span class="arrow">→</span><span>${escapeHtml(arr)}</span>`;
    } else if (dep) {
      routeEl.innerHTML = `<span>${escapeHtml(dep)}</span><span class="arrow">→</span><span class="empty">?</span>`;
    } else if (arr) {
      routeEl.innerHTML = `<span class="empty">?</span><span class="arrow">→</span><span>${escapeHtml(arr)}</span>`;
    } else {
      routeEl.innerHTML = `<span class="empty">未设置航线</span>`;
    }
  }

  function setClock(ms) {
    clockEl.textContent = fmt(ms);
  }

  // ---------- 计时核心 ----------
  function tick() {
    setClock(elapsed + (Date.now() - startTime));
  }

  function startTimer() {
    const { dep, arr } = readAirports();
    depInput.classList.remove('invalid');
    arrInput.classList.remove('invalid');

    if (!validIcao(dep)) {
      depInput.classList.add('invalid');
      log('起飞机场无效，请输入 4 位 ICAO 代码。', 'err');
      depInput.focus();
      return;
    }
    if (!validIcao(arr)) {
      arrInput.classList.add('invalid');
      log('落地机场无效，请输入 4 位 ICAO 代码。', 'err');
      arrInput.focus();
      return;
    }

    if (state === 'running') return;

    if (state === 'paused') {
      startTime = Date.now();
      timerId = setInterval(tick, 200);
      state = 'running';
      clockEl.className = 'running';
      startBtn.textContent = '暂停';
      startBtn.classList.add('stop');
      log(`继续计时：${dep} → ${arr}`, 'info');
      return;
    }

    elapsed = 0;
    startTime = Date.now();
    timerId = setInterval(tick, 200);
    state = 'running';
    clockEl.className = 'running';
    startBtn.textContent = '暂停';
    startBtn.classList.add('stop');
    log(`开始飞行：${dep} → ${arr}`, 'ok');
  }

  function pauseTimer() {
    if (state !== 'running') return;
    elapsed += Date.now() - startTime;
    clearInterval(timerId);
    timerId = null;
    state = 'paused';
    clockEl.className = 'paused';
    startBtn.textContent = '继续';
    startBtn.classList.remove('stop');
    setClock(elapsed);
    log('计时已暂停。', 'warn');
  }

  function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    state = 'idle';
    startTime = 0;
    elapsed = 0;
    clockEl.className = '';
    setClock(0);
    startBtn.textContent = '开始';
    startBtn.classList.remove('stop');
    depInput.classList.remove('invalid');
    arrInput.classList.remove('invalid');
    log('计时器已重置。', 'info');
  }

  // ---------- 导出 .json ----------
  function exportJSON() {
    const { dep, arr } = readAirports();
    let currentElapsed = elapsed;
    if (state === 'running') currentElapsed += Date.now() - startTime;

    const data = {
      app: 'AeroChrono',
      version: 1,
      exportedAt: new Date().toISOString(),
      flight: {
        departure: dep || null,
        arrival: arr || null,
      },
      timer: {
        state: state,
        elapsedMs: currentElapsed,
        displayTime: fmt(currentElapsed),
      },
      logs: logEntries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    a.href = url;
    a.download = `aerochrono-${dep || 'XXXX'}-${arr || 'XXXX'}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log(`已导出备份：${a.download}`, 'ok');
  }

  // ---------- 导入 .json ----------
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object' || !data.flight) {
          throw new Error('不是有效的 AeroChrono 备份文件');
        }

        const dep = (data.flight.departure || '').toString().toUpperCase().slice(0, 4);
        const arr = (data.flight.arrival || '').toString().toUpperCase().slice(0, 4);
        depInput.value = dep;
        arrInput.value = arr;
        depInput.classList.remove('invalid');
        arrInput.classList.remove('invalid');
        updateRouteDisplay();
        saveAirports();

        // 恢复计时（running 也恢复为 paused，避免时间跳变造成困惑）
        clearInterval(timerId);
        timerId = null;
        const t = data.timer || {};
        const elapsedMs = Math.max(0, Number(t.elapsedMs) || 0);
        elapsed = elapsedMs;
        startTime = 0;

        if (t.state === 'idle' || elapsedMs === 0) {
          state = 'idle';
          clockEl.className = '';
          startBtn.textContent = '开始';
          startBtn.classList.remove('stop');
        } else {
          state = 'paused';
          clockEl.className = 'paused';
          startBtn.textContent = '继续';
          startBtn.classList.remove('stop');
        }
        setClock(elapsed);

        // 恢复日志
        logEl.innerHTML = '';
        logEntries = [];
        const importedLogs = Array.isArray(data.logs) ? data.logs.slice(-60) : [];
        importedLogs.forEach((item) => {
          if (!item || !item.message) return;
          logEntries.push(item);
          const line = document.createElement('div');
          line.className = 'line';
          line.innerHTML = `<span class="time">[${escapeHtml(item.time || '--:--:--')}]</span><span class="${item.level || ''}">${escapeHtml(item.message)}</span>`;
          logEl.appendChild(line);
        });
        logEl.scrollTop = logEl.scrollHeight;

        log(`已导入备份：${file.name}`, 'ok');
        if (state === 'paused') {
          log(`已恢复 ${dep || '?'} → ${arr || '?'}，计时停在 ${fmt(elapsed)}，点“继续”接着飞。`, 'info');
        } else {
          log(`已恢复 ${dep || '?'} → ${arr || '?'}（未开始计时）。`, 'info');
        }
      } catch (err) {
        log(`导入失败：${err.message}`, 'err');
      }
    };
    reader.onerror = () => log('导入失败：无法读取文件。', 'err');
    reader.readAsText(file);
  }

  // ---------- 事件 ----------
  startBtn.addEventListener('click', () => {
    if (state === 'running') pauseTimer();
    else startTimer();
  });

  resetBtn.addEventListener('click', resetTimer);
  exportBtn.addEventListener('click', exportJSON);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
    e.target.value = '';
  });

  [depInput, arrInput].forEach((input) => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      input.classList.remove('invalid');
      updateRouteDisplay();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startBtn.click();
    });
    input.addEventListener('change', saveAirports);
  });

  // ---------- 拖拽 + 点击折叠 ----------
  let headerDown = null;
  headerEl.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    const rect = card.getBoundingClientRect();
    headerDown = {
      x: e.clientX,
      y: e.clientY,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
  });
  window.addEventListener('mousemove', (e) => {
    if (!headerDown) return;
    if (Math.hypot(e.clientX - headerDown.x, e.clientY - headerDown.y) > 4) {
      headerDown.moved = true;
    }
    if (headerDown.moved) {
      card.style.left = (e.clientX - headerDown.dx) + 'px';
      card.style.top = (e.clientY - headerDown.dy) + 'px';
      card.style.right = 'auto';
      card.style.bottom = 'auto';
    }
  });
  window.addEventListener('mouseup', () => {
    if (headerDown && !headerDown.moved) {
      card.classList.toggle('collapsed');
    }
    headerDown = null;
  });

  // ---------- localStorage ----------
  function saveAirports() {
    const { dep, arr } = readAirports();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dep, arr }));
    } catch (_) {}
  }

  // ---------- 初始化 ----------
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.dep) depInput.value = saved.dep;
    if (saved.arr) arrInput.value = saved.arr;
  } catch (_) {}

  updateRouteDisplay();
  setClock(0);
  log('AeroChrono 已加载，请输入起飞机场与落地机场。', 'info');
})();