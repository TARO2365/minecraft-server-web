/* ===== เรนเดอร์หน้าเว็บจากข้อมูลใน data.js ===== */
(() => {
  const D = window.MC;
  const $ = (s) => document.querySelector(s);
  const cat = (id) => D.categories[id] || { label: id, color: "#888" };

  let currentPlugin = null;   // ปลั๊กที่เปิด modal อยู่
  let cmdFilter = "must";     // must = เฉพาะที่ต้องรู้, all = ทั้งหมด

  /* ---------- toast ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "toast"; toastEl.id = "toast";
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  /* ---------- คัดลอก (รองรับทั้ง https และเปิดไฟล์ตรงๆ file://) ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast("📋 คัดลอกแล้ว: " + text)).catch(fallback);
    } else { fallback(); }
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("📋 คัดลอกแล้ว: " + text); }
      catch { toast("คัดลอกไม่ได้ — ก๊อปเอง: " + text); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- หัวเว็บ ---------- */
  function renderHero() {
    const s = D.server;
    $("#hero").innerHTML = `
      <h1>🎮 ${s.name}</h1>
      <div class="sub">${s.tagline}</div>
      <div class="meta">
        <span class="chip"><b>แกน:</b> ${s.core}</span>
        <span class="chip"><b>เวอร์ชัน:</b> ${s.mc}</span>
        <span class="chip"><b>Java:</b> ${s.java}</span>
        <span class="chip"><b>RAM:</b> ${s.ram}</span>
        <span class="chip"><b>ที่อยู่:</b> ${s.address}</span>
        <span class="chip"><b>OP:</b> ${s.op}</span>
        <span class="chip"><b>บูต:</b> ${s.bootTime}</span>
        <span class="chip"><b>GitHub:</b> <a href="${s.github}" target="_blank">repo</a></span>
        <span class="chip"><b>📘 แผนเซิร์ฟ:</b> <a href="plan.html">เปิดดู interactive</a></span>
        <span class="chip"><b>📖 คู่มือ:</b> <a href="guide.html">วิธีใช้เซิร์ฟ+ปลั๊กอิน</a></span>
      </div>`;
  }

  /* ==========================================================
     Web Panel — ควบคุมเซิร์ฟ + จอ CMD สด
     ต้องเปิดผ่าน node server.js (http://localhost:8765) ถึงคุมได้
     ถ้าเปิดเป็นไฟล์ตรงๆ/GitHub Pages จะเป็นโหมดดูอย่างเดียว
     ========================================================== */
  let panelOnline = false;   // ต่อ backend ได้ไหม
  let srvOwned = false;      // เซิร์ฟถูกเปิดจากเว็บไหม (คุมได้เต็มที่)

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- PIN (สำหรับเปิดจากเครื่องอื่นใน LAN เช่น tablet) ---------- */
  const getPin = () => localStorage.getItem("panelPin") || "";
  const pinHeaders = () => (getPin() ? { "X-Pin": getPin() } : {});
  let pinAsked = false;
  function askPin() {
    if (pinAsked) return false;
    pinAsked = true;
    const p = prompt("🔒 ใส่ PIN ของ Web Panel\n(ดูได้จากหน้าต่าง CMD ของเว็บบนคอม)");
    if (p) { localStorage.setItem("panelPin", p.trim()); location.reload(); return true; }
    return false;
  }

  /* ไฮไลต์สี log ตามความสำคัญ — อ่านปราดเดียวรู้ว่าอะไรพัง อะไรผ่าน */
  function highlightLine(raw, type) {
    let cls = "lg";
    if (type === "system") cls = "lg-system";
    else if (type === "input") cls = "lg-input";
    else if (type === "stderr" || /\b(ERROR|SEVERE|Exception|Caused by:|THIS WILL CREATE BUGS)/i.test(raw)) cls = "lg-error";
    else if (/\bWARN\b/.test(raw)) cls = "lg-warn";
    else if (/Done \([\d.]+s\)!/.test(raw)) cls = "lg-done";
    else if (/joined the game|left the game|logged in with|lost connection/.test(raw)) cls = "lg-player";

    let html = esc(raw);
    // timestamp [12:34:56] → จาง
    html = html.replace(/^(\[\d{2}:\d{2}:\d{2}\])/, `<span class="lg-time">$1</span>`);
    // แท็ก thread/ปลั๊กอิน [Server thread/INFO] [BentoBox] → สีฟ้า
    html = html.replace(/(\[[^\]\[]{1,40}?(?:INFO|WARN|ERROR)[^\]\[]*?\])/g, `<span class="lg-tag">$1</span>`);
    html = html.replace(/(\[(?:BentoBox|MythicMobs|AuraSkills|ItemsAdder|Citizens|TAB|LuckPerms|Vault|Essentials\w*|PlaceholderAPI|WorldGuard|FastAsyncWorldEdit|Multiverse[\w-]*|DeluxeMenus|EconomyShopGUI|DecentHolograms|ProtocolLib|spark)[^\]]*\])/g, `<span class="lg-plugin">$1</span>`);
    // ตัวเลขเวลาบูต Done (37.7s) → เขียวเน้น
    html = html.replace(/(Done \([\d.]+s\)!)/, `<span class="lg-done-strong">$1</span>`);
    return `<div class="${cls}">${html}</div>`;
  }

  const consoleEl = $("#console");
  let lineCount = 0;
  function appendLog(raw, type) {
    if (!consoleEl) return;
    consoleEl.insertAdjacentHTML("beforeend", highlightLine(raw, type));
    lineCount++;
    if (lineCount > 600) { consoleEl.removeChild(consoleEl.firstChild); lineCount--; }
    const as = $("#autoScroll");
    if (!as || as.checked) consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function setStatus(running, owned) {
    const pill = $("#statusPill");
    srvOwned = owned;
    if (!panelOnline) {
      pill.className = "status-pill view"; pill.textContent = "◌ โหมดดูอย่างเดียว";
      $("#btnStart").disabled = true; $("#btnStop").disabled = true;
      return;
    }
    if (running && owned) { pill.className = "status-pill on"; pill.textContent = "● ออนไลน์ (เปิดจากเว็บ)"; }
    else if (running) { pill.className = "status-pill ext"; pill.textContent = "● ออนไลน์ (เปิดจากหน้าต่าง CMD)"; }
    else { pill.className = "status-pill off"; pill.textContent = "● ออฟไลน์"; }
    $("#btnStart").disabled = running;
    $("#btnStop").disabled = !(running && owned);
  }

  async function pollStatus() {
    try {
      const r = await fetch("/api/status", { headers: pinHeaders() });
      if (r.status === 401) { askPin(); panelOnline = false; setStatus(false, false); $("#statusPill").textContent = "🔒 ต้องใส่ PIN"; return; }
      const s = await r.json();
      panelOnline = true;
      setStatus(s.running, s.owned);
      const up = $("#uptime");
      up.textContent = s.uptimeSec ? `⏱ รันมา ${Math.floor(s.uptimeSec / 60)} นาที ${s.uptimeSec % 60} วิ` : "";
    } catch {
      panelOnline = false;
      setStatus(false, false);
    }
  }

  async function api(path, body) {
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...pinHeaders() }, body: body ? JSON.stringify(body) : undefined });
      if (r.status === 401) { askPin(); return false; }
      const j = await r.json();
      if (!j.ok) toast("⚠ " + j.error);
      return j.ok;
    } catch { toast("⚠ ต่อ backend ไม่ได้ — เปิดเว็บผ่าน start-web.bat ก่อน"); return false; }
  }

  function initPanel() {
    if (!consoleEl) return;
    // ปุ่ม Run / Stop
    $("#btnStart").addEventListener("click", async () => {
      $("#btnStart").disabled = true;
      if (await api("/api/start")) toast("▶ กำลังสตาร์ทเซิร์ฟ... ดู log ข้างล่างได้เลย");
      pollStatus();
    });
    $("#btnStop").addEventListener("click", async () => {
      if (await api("/api/stop")) toast("⏹ สั่งปิดแล้ว — รอเซฟโลก");
      pollStatus();
    });
    // ช่องพิมพ์คำสั่ง
    $("#cmdForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const inp = $("#cmdInput");
      const cmd = inp.value.trim();
      if (!cmd) return;
      if (await api("/api/command", { cmd })) inp.value = "";
    });
    // ปุ่มตั้งค่าเซิร์ฟ + จัดการยศ
    $("#btnConfig").addEventListener("click", openConfig);
    $("#btnRanks").addEventListener("click", openRanks);
    // ปุ่มคำสั่งด่วน
    const quick = [
      ["list", "ใครออนบ้าง"], ["say สวัสดีชาวเซิฟ!", "ประกาศ"], ["spark tps", "เช็ก TPS"],
      ["whitelist list", "ดู whitelist"], ["save-all", "เซฟโลกเดี๋ยวนี้"]
    ];
    $("#quickCmds").innerHTML = `<span class="qlabel">คำสั่งด่วน:</span>` + quick.map(([c, l]) =>
      `<button class="qcmd" data-qcmd="${c}">${l} <code>/${c.split(" ")[0]}</code></button>`).join("");

    // ต่อ log stream (SSE) — EventSource ใส่ header ไม่ได้ เลยส่ง PIN ทาง query แทน
    try {
      const es = new EventSource("/api/logs" + (getPin() ? "?pin=" + encodeURIComponent(getPin()) : ""));
      es.onmessage = (e) => {
        try { const m = JSON.parse(e.data); appendLog(m.line, m.type); } catch {}
      };
      es.onerror = () => { /* backend หลุด — pollStatus จะสลับเป็นโหมดดูอย่างเดียวเอง */ };
    } catch {}

    pollStatus();
    setInterval(pollStatus, 3000);

    // ถ้าเปิดแบบ file:// หรือ GitHub Pages — โชว์วิธีเปิดโหมดควบคุม
    if (location.protocol === "file:" || location.hostname.endsWith("github.io")) {
      appendLog("โหมดดูอย่างเดียว — อยากควบคุมเซิร์ฟจากเว็บ:", "system");
      appendLog("1) ดับเบิลคลิก start-web.bat ในโฟลเดอร์ minecraft-server-web", "system");
      appendLog("2) เปิด http://localhost:8765", "system");
    }
  }

  /* ==========================================================
     ตั้งค่าเซิร์ฟ — แก้ server.properties จากหน้าเว็บ
     (มีผลตอนรีสตาร์ทเซิร์ฟ / ค่าลับอย่างรหัส RCON ไม่โผล่ที่นี่)
     ========================================================== */
  const CFG_GROUPS = [
    { title: "🏷 ทั่วไป", fields: [
      { key: "motd", label: "ข้อความเซิร์ฟ (MOTD)", type: "text", hint: "โชว์ในหน้ารายชื่อเซิร์ฟของผู้เล่น" },
      { key: "max-players", label: "ผู้เล่นสูงสุด", type: "number" },
      { key: "difficulty", label: "ความยาก", type: "select", options: ["peaceful", "easy", "normal", "hard"] },
      { key: "gamemode", label: "โหมดเริ่มต้น", type: "select", options: ["survival", "creative", "adventure", "spectator"] },
      { key: "force-gamemode", label: "บังคับโหมดทุกครั้งที่เข้า", type: "bool" }
    ]},
    { title: "🌐 เครือข่าย / IP", fields: [
      { key: "server-ip", label: "IP ที่เปิดรับ (bind)", type: "text", hint: "ปกติเว้นว่าง = รับทุก IP ของเครื่อง" },
      { key: "server-port", label: "พอร์ต", type: "number", hint: "ค่ามาตรฐาน 25565" },
      { key: "online-mode", label: "เช็ก Minecraft แท้", type: "bool", hint: "false = เปิดให้เครื่องเถื่อน (ต้องลง AuthMe ก่อน!)" },
      { key: "enable-status", label: "โชว์สถานะในหน้า multiplayer", type: "bool" },
      { key: "hide-online-players", label: "ซ่อนรายชื่อคนออนไลน์", type: "bool" }
    ]},
    { title: "👥 ผู้เล่น / Whitelist", fields: [
      { key: "white-list", label: "เปิดระบบ whitelist", type: "bool", hint: "เปิดแล้วต้อง /whitelist add ก่อนถึงเข้าได้" },
      { key: "enforce-whitelist", label: "เตะคนนอก whitelist ทันที", type: "bool" },
      { key: "player-idle-timeout", label: "เตะคน AFK (นาที)", type: "number", hint: "0 = ไม่เตะ" },
      { key: "allow-flight", label: "อนุญาตการบิน", type: "bool", hint: "ควรเปิดถ้าใช้ IslandFly กันโดนเตะผิดๆ" },
      { key: "spawn-protection", label: "รัศมีกันแก้ไขรอบ spawn (บล็อก)", type: "number" }
    ]},
    { title: "⚡ ประสิทธิภาพ", fields: [
      { key: "view-distance", label: "ระยะมองเห็น (chunk)", type: "number", hint: "RAM 4GB แนะนำ 8-10" },
      { key: "simulation-distance", label: "ระยะประมวลผล (chunk)", type: "number", hint: "ต่ำกว่า view-distance ได้ ช่วยลดแลค" },
      { key: "pause-when-empty-seconds", label: "พักเซิร์ฟเมื่อไม่มีคน (วินาที)", type: "number", hint: "-1 = ไม่พัก" }
    ]}
  ];
  let cfgOriginal = {};

  async function openConfig() {
    let data;
    try {
      const r = await fetch("/api/config", { headers: pinHeaders() });
      if (r.status === 401) { askPin(); return; }
      data = await r.json();
    } catch { data = null; }
    if (!data || !data.ok) { toast("⚠ อ่าน config ไม่ได้ — เปิดเว็บผ่าน start-web.bat ก่อน"); return; }
    cfgOriginal = data.config;
    const curated = new Set(CFG_GROUPS.flatMap(g => g.fields.map(f => f.key)));

    const field = (f) => {
      const v = cfgOriginal[f.key];
      if (v === undefined) return "";   // key ไม่มีในไฟล์ — ไม่โชว์
      let input;
      if (f.type === "bool") input = `<select data-cfg="${f.key}"><option value="true"${v === "true" ? " selected" : ""}>เปิด (true)</option><option value="false"${v === "false" ? " selected" : ""}>ปิด (false)</option></select>`;
      else if (f.type === "select") input = `<select data-cfg="${f.key}">${f.options.map(o => `<option${o === v ? " selected" : ""}>${o}</option>`).join("")}</select>`;
      else input = `<input type="${f.type}" data-cfg="${f.key}" value="${esc(v)}">`;
      return `<div class="cfg-row"><label>${f.label}<small>${f.key}${f.hint ? " — " + f.hint : ""}</small></label>${input}</div>`;
    };

    const advanced = Object.keys(cfgOriginal).filter(k => !curated.has(k)).sort().map(k =>
      `<div class="cfg-row"><label>${k}</label><input type="text" data-cfg="${k}" value="${esc(cfgOriginal[k])}"></div>`).join("");

    $("#cfgModal").innerHTML = `
      <div class="modal-head">
        <div class="ico">⚙</div>
        <div><h2>ตั้งค่าเซิร์ฟเวอร์</h2><div class="ver">server.properties — บันทึกแล้วมีผลตอนรีสตาร์ทเซิร์ฟ</div></div>
        <button class="close-btn" data-cfgclose>×</button>
      </div>
      <div class="modal-body">
        ${CFG_GROUPS.map(g => `<div class="cfg-group"><div class="cfg-title">${g.title}</div>${g.fields.map(field).join("")}</div>`).join("")}
        <details class="cfg-adv"><summary>🔧 ค่าอื่นๆ ทั้งหมด (ขั้นสูง — แก้เฉพาะที่รู้ว่าทำอะไร)</summary>${advanced}</details>
        <div class="cfg-actions">
          <span class="cfg-note">💾 เฉพาะค่าที่เปลี่ยนเท่านั้นที่ถูกบันทึก</span>
          <button class="pbtn run" id="cfgSave">บันทึก</button>
        </div>
      </div>`;
    $("#cfgOverlay").classList.add("show");
    document.body.style.overflow = "hidden";

    $("#cfgSave").addEventListener("click", async () => {
      const changes = {};
      document.querySelectorAll("[data-cfg]").forEach(el => {
        const k = el.dataset.cfg;
        if (el.value !== cfgOriginal[k]) changes[k] = el.value;
      });
      if (!Object.keys(changes).length) { toast("ไม่มีค่าไหนเปลี่ยน"); return; }
      try {
        const r = await (await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json", ...pinHeaders() }, body: JSON.stringify({ changes }) })).json();
        if (r.ok) { toast(`💾 บันทึกแล้ว ${r.applied.length} ค่า (${r.applied.join(", ")}) — มีผลตอนรีสตาร์ท`); closeConfig(); }
        else toast("⚠ " + r.error);
      } catch { toast("⚠ ต่อ backend ไม่ได้"); }
    });
  }
  function closeConfig() {
    $("#cfgOverlay").classList.remove("show");
    document.body.style.overflow = "";
  }

  /* ==========================================================
     🎖 จัดการยศ (LuckPerms) — realtime ผ่าน RCON
     ข้อมูลเก็บใน ranks.json / กด "ใช้กับเซิร์ฟ" = ยิงคำสั่งทันที
     ========================================================== */
  let rankData = null;
  let editingRankId = null;
  const ICON_SUGGEST = ["☆", "★", "◆", "✦", "♥", "●", "♦", "⚡"];
  const COLORS = [["&7", "เทา"], ["&f", "ขาว"], ["&a", "เขียว"], ["&b", "ฟ้า"], ["&e", "เหลือง"], ["&6", "ทอง"], ["&c", "แดง"], ["&d", "ชมพู"], ["&5", "ม่วง"], ["&9", "น้ำเงิน"]];
  const MC_COLOR = { "&7": "#AAAAAA", "&f": "#FFFFFF", "&a": "#55FF55", "&b": "#55FFFF", "&e": "#FFFF55", "&6": "#FFAA00", "&c": "#FF5555", "&d": "#FF55FF", "&5": "#AA00AA", "&9": "#5555FF" };

  async function rankApi(action, body) {
    try {
      const r = await fetch("/api/ranks/" + action, { method: "POST", headers: { "Content-Type": "application/json", ...pinHeaders() }, body: JSON.stringify(body || {}) });
      if (r.status === 401) { askPin(); return { ok: false, error: "ต้องใส่ PIN" }; }
      return await r.json();
    } catch { return { ok: false, error: "ต่อ backend ไม่ได้" }; }
  }

  function rankForm(r) {
    const isNew = !r;
    r = r || { id: "", display: "", icon: "★", color: "&a", weight: 10, presets: ["basic"], extra: [], note: "" };
    const presetBoxes = Object.entries(rankData.presets).map(([k, p]) => `
      <label class="preset-box"><input type="checkbox" data-rpreset="${k}" ${r.presets.includes(k) ? "checked" : ""}>
        <b>${p.name}</b><small>${p.desc} (${p.perms.length} สิทธิ์)</small></label>`).join("");
    return `
      <div class="rank-form" data-editing="${isNew ? "" : r.id}">
        <div class="cfg-title">${isNew ? "➕ สร้างยศใหม่" : "✏ แก้ยศ: " + esc(r.display)}</div>
        <div class="cfg-row"><label>รหัสยศ (a-z ไม่มีเว้นวรรค)<small>ใช้ในคำสั่ง lp — สร้างแล้วห้ามเปลี่ยน</small></label>
          <input type="text" id="rkId" value="${esc(r.id)}" ${isNew ? "" : "disabled"} placeholder="เช่น vip"></div>
        <div class="cfg-row"><label>ชื่อโชว์<small>ขึ้นในแชท/แถบ tab</small></label>
          <input type="text" id="rkDisplay" value="${esc(r.display)}" placeholder="เช่น มือใหม่"></div>
        <div class="cfg-row"><label>ไอคอนหน้าชื่อ<small>สัญลักษณ์ที่ Minecraft แสดงได้</small></label>
          <div class="icon-pick"><input type="text" id="rkIcon" value="${esc(r.icon)}" maxlength="2">
          ${ICON_SUGGEST.map(i => `<button type="button" class="ipick" data-icon="${i}">${i}</button>`).join("")}</div></div>
        <div class="cfg-row"><label>สียศ</label>
          <select id="rkColor">${COLORS.map(([c, n]) => `<option value="${c}" ${c === r.color ? "selected" : ""}>${n} (${c})</option>`).join("")}</select></div>
        <div class="cfg-row"><label>น้ำหนัก (weight)<small>เลขสูง = ยศใหญ่กว่า ใช้เรียงใน tab</small></label>
          <input type="number" id="rkWeight" value="${r.weight}"></div>
        <div class="cfg-title" style="margin-top:14px">ชุดสิทธิ์ (ติ๊กได้หลายชุด)</div>
        <div class="preset-grid">${presetBoxes}</div>
        <div class="cfg-row"><label>สิทธิ์เพิ่มเติม<small>1 บรรทัด = 1 permission node</small></label>
          <textarea id="rkExtra" rows="3" placeholder="เช่น essentials.back">${esc((r.extra || []).join("\n"))}</textarea></div>
        <div class="cfg-actions">
          <span class="cfg-note" id="rkPreview"></span>
          <button class="pbtn run" id="rkSave">${isNew ? "สร้าง + ใช้กับเซิร์ฟ" : "บันทึก + ใช้กับเซิร์ฟ"}</button>
        </div>
      </div>`;
  }

  function renderRankModal() {
    const list = rankData.ranks.slice().sort((a, b) => b.weight - a.weight).map(r => `
      <div class="rank-row">
        <span class="rank-badge" style="color:${MC_COLOR[r.color] || "#fff"}">${esc(r.icon)} ${esc(r.display)}</span>
        <span class="rank-meta">${r.id} • w${r.weight} • ${r.presets.length} ชุด${r.extra.length ? " +" + r.extra.length : ""}</span>
        <span class="rank-btns">
          <button class="rbtn" data-redit="${r.id}">✏ แก้</button>
          <button class="rbtn apply" data-rapply="${r.id}">⚡ ใช้กับเซิร์ฟ</button>
          <button class="rbtn del" data-rdel="${r.id}">🗑</button>
        </span>
      </div>`).join("");

    const presetEditor = Object.entries(rankData.presets).map(([k, p]) => `
      <div class="cfg-row preset-edit"><label>${p.name}<small>${p.desc}</small></label>
        <textarea data-preset="${k}" rows="3">${esc(p.perms.join("\n"))}</textarea></div>`).join("");

    $("#rankModal").innerHTML = `
      <div class="modal-head">
        <div class="ico">🎖</div>
        <div><h2>จัดการยศ (LuckPerms)</h2><div class="ver">กด ⚡ = มีผลในเซิร์ฟทันที (ต้องเซิร์ฟออนไลน์) • ข้อมูลเก็บใน ranks.json</div></div>
        <button class="close-btn" data-rankclose>×</button>
      </div>
      <div class="modal-body">
        <div class="cfg-title">ยศทั้งหมด (${rankData.ranks.length})</div>
        <div class="rank-list">${list}</div>
        <div class="cfg-row assign-row"><label>ตั้งยศให้ผู้เล่น<small>ผู้เล่นต้องเคยเข้าเซิร์ฟแล้ว</small></label>
          <input type="text" id="asPlayer" placeholder="ชื่อผู้เล่น">
          <select id="asRank">${rankData.ranks.map(r => `<option value="${r.id}">${esc(r.icon)} ${esc(r.display)}</option>`).join("")}</select>
          <button class="pbtn send" id="asGo">ตั้งยศ</button></div>
        <div id="rankFormWrap">${rankForm(editingRankId ? rankData.ranks.find(x => x.id === editingRankId) : null)}</div>
        <details class="cfg-adv"><summary>🔧 แก้ชุดสิทธิ์ทั้ง 6 ชุด (มีผลกับทุกยศที่ใช้ชุดนั้น — แก้แล้วกด ⚡ ยศนั้นซ้ำ)</summary>
          ${presetEditor}
          <div class="cfg-actions"><button class="pbtn run" id="presetSave">บันทึกชุดสิทธิ์</button></div>
        </details>
      </div>`;
    updateRankPreview();
  }

  function updateRankPreview() {
    const el = $("#rkPreview");
    if (!el) return;
    const icon = ($("#rkIcon") || {}).value || "";
    const disp = ($("#rkDisplay") || {}).value || "";
    const color = ($("#rkColor") || {}).value || "&f";
    el.innerHTML = `ตัวอย่างในแชท: <span class="mc-preview">[<span style="color:${MC_COLOR[color] || "#fff"}">${esc(icon)} ${esc(disp)}</span>]</span>`;
  }

  async function openRanks() {
    let r;
    try {
      const res = await fetch("/api/ranks", { headers: pinHeaders() });
      if (res.status === 401) { askPin(); return; }
      r = await res.json();
    } catch { r = null; }
    if (!r || !r.ok) { toast("⚠ " + (r ? r.error : "ต่อ backend ไม่ได้ — เปิดผ่าน start-web.bat ก่อน")); return; }
    rankData = r.data;
    editingRankId = null;
    renderRankModal();
    $("#rankOverlay").classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeRanks() {
    $("#rankOverlay").classList.remove("show");
    document.body.style.overflow = "";
  }

  function collectRankForm() {
    const id = ($("#rkId").value || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(id)) { toast("⚠ รหัสยศต้องเป็น a-z/0-9 ยาว 2-20 ตัว"); return null; }
    const presets = [...document.querySelectorAll("[data-rpreset]:checked")].map(x => x.dataset.rpreset);
    return {
      id,
      display: $("#rkDisplay").value.trim() || id,
      icon: $("#rkIcon").value.trim() || "★",
      color: $("#rkColor").value,
      weight: parseInt($("#rkWeight").value) || 10,
      presets,
      extra: $("#rkExtra").value.split("\n").map(x => x.trim()).filter(Boolean),
      note: (rankData.ranks.find(x => x.id === id) || {}).note || ""
    };
  }

  async function saveAndApplyRank() {
    const r = collectRankForm();
    if (!r) return;
    const idx = rankData.ranks.findIndex(x => x.id === r.id);
    if (idx >= 0) rankData.ranks[idx] = r; else rankData.ranks.push(r);
    const s = await rankApi("save", { data: rankData });
    if (!s.ok) { toast("⚠ " + s.error); return; }
    const a = await rankApi("apply", { rankId: r.id });
    if (a.ok) toast(`⚡ ยศ "${r.display}" มีผลในเซิร์ฟแล้ว`);
    else toast(`💾 บันทึกแล้ว — ${a.error} (กด ⚡ ซ้ำตอนเซิร์ฟออนไลน์)`);
    editingRankId = null;
    renderRankModal();
  }

  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-rankclose]") || e.target.id === "rankOverlay") { closeRanks(); return; }
    const ip = e.target.closest(".ipick");
    if (ip) { $("#rkIcon").value = ip.dataset.icon; updateRankPreview(); return; }
    const ed = e.target.closest("[data-redit]");
    if (ed) { editingRankId = ed.dataset.redit; renderRankModal(); return; }
    const ap = e.target.closest("[data-rapply]");
    if (ap) {
      ap.disabled = true;
      const r = await rankApi("apply", { rankId: ap.dataset.rapply });
      ap.disabled = false;
      toast(r.ok ? "⚡ อัปเดตยศเข้าเซิร์ฟแล้ว" : "⚠ " + r.error);
      return;
    }
    const dl = e.target.closest("[data-rdel]");
    if (dl) {
      const rk = rankData.ranks.find(x => x.id === dl.dataset.rdel);
      if (!confirm(`ลบยศ "${rk.display}" (${rk.id})? ผู้เล่นที่ถือยศนี้จะหลุดกลับ default`)) return;
      const r = await rankApi("delete", { rankId: rk.id });
      if (r.ok) { toast("🗑 ลบยศแล้ว" + (r.serverApplied ? "" : " (จากไฟล์ — เซิร์ฟออฟไลน์)")); openRanks(); }
      else toast("⚠ " + r.error);
      return;
    }
    if (e.target.id === "rkSave") { saveAndApplyRank(); return; }
    if (e.target.id === "asGo") {
      const r = await rankApi("assign", { player: $("#asPlayer").value, rankId: $("#asRank").value });
      toast(r.ok ? "🎖 ตั้งยศให้แล้ว" : "⚠ " + r.error);
      return;
    }
    if (e.target.id === "presetSave") {
      document.querySelectorAll("[data-preset]").forEach(ta => {
        rankData.presets[ta.dataset.preset].perms = ta.value.split("\n").map(x => x.trim()).filter(Boolean);
      });
      const r = await rankApi("save", { data: rankData });
      toast(r.ok ? "💾 บันทึกชุดสิทธิ์แล้ว — อย่าลืมกด ⚡ ยศที่ใช้ชุดนี้" : "⚠ " + r.error);
      return;
    }
  });
  document.addEventListener("input", (e) => {
    if (["rkIcon", "rkDisplay", "rkColor"].includes(e.target.id)) updateRankPreview();
  });

  /* ---------- ปลั๊กอินที่ยังขาด ---------- */
  function renderPlanned() {
    const el = $("#planned");
    if (!el || !D.planned) return;
    const phaseColor = { 1: "var(--red)", 2: "var(--orange)", 3: "var(--purple)" };
    el.innerHTML = D.planned.map(p => `
      <div class="pcard">
        <div class="ptop">
          <span class="pico">${p.icon}</span>
          <div><h3>${p.name}</h3><span class="pstatus">${p.status}</span></div>
          <span class="phase" style="background:${phaseColor[p.phase] || "var(--navy)"}">เฟส ${p.phase}</span>
        </div>
        <div class="pwhy">${p.why}</div>
        <div class="ppairs">🔗 ${p.pairs}</div>
      </div>`).join("");
  }

  /* ---------- ตัวอย่างวงจรการเชื่อมปลั๊กอิน ---------- */
  function renderFlows() {
    const el = $("#flows");
    if (!el || !D.flows) return;
    el.innerHTML = D.flows.map(f => `
      <div class="flow">
        <div class="flow-title">${f.icon} ${f.title}</div>
        <div class="flow-steps">
          ${f.steps.map((s, i) => `
            ${i ? `<div class="flow-arrow">▼</div>` : ""}
            <div class="flow-step"><span class="flow-plug">${s.plug}</span><span class="flow-text">${s.text}</span></div>`).join("")}
        </div>
        <div class="flow-note">💡 ${f.note}</div>
      </div>`).join("");
  }

  /* ---------- ฟิลเตอร์หมวด ---------- */
  let activeCat = "all";
  function renderFilters() {
    const used = [...new Set(D.plugins.map(p => p.cat))];
    let html = `<button class="fbtn active" data-cat="all">ทั้งหมด (${D.plugins.length})</button>`;
    used.forEach(c => {
      const n = D.plugins.filter(p => p.cat === c).length;
      html += `<button class="fbtn" data-cat="${c}">${cat(c).label} (${n})</button>`;
    });
    $("#filters").innerHTML = html;
  }

  /* ---------- การ์ด ---------- */
  function renderGrid() {
    const list = activeCat === "all" ? D.plugins : D.plugins.filter(p => p.cat === activeCat);
    $("#grid").innerHTML = list.map(p => {
      const c = cat(p.cat);
      const mustN = (p.commands || []).filter(x => x.must).length;
      return `
      <div class="card" data-id="${p.id}">
        <span class="cat-pill" style="background:${c.color}">${c.label}</span>
        <div class="top">
          <div class="ico">${p.icon}</div>
          <div>
            <h3>${p.name}</h3>
            <div class="ver">v${p.version}</div>
          </div>
        </div>
        <div class="tag">${p.tagline}</div>
        <div class="card-foot">
          <span class="mini">⌨️ ${(p.commands||[]).length} คำสั่ง</span>
          ${mustN ? `<span class="mini must">⭐ ต้องรู้ ${mustN}</span>` : ""}
          <span class="mini go">กดดู →</span>
        </div>
      </div>`;
    }).join("");
  }

  /* ---------- ส่วนคำสั่งใน modal (เปลี่ยนตาม toggle) ---------- */
  function renderCommands() {
    if (!currentPlugin) return;
    const p = currentPlugin, c = cat(p.cat);
    const all = p.commands || [];
    const wrap = $("#cmdWrap");
    if (!wrap) return;
    if (!all.length) {
      wrap.innerHTML = `<div class="cmd-empty">ไม่มีคำสั่งสำหรับผู้เล่น — ปลั๊กนี้ทำงานเบื้องหลัง</div>`;
      return;
    }
    const list = cmdFilter === "must" ? all.filter(x => x.must) : all;
    const chips = list.map(x => `
      <button class="cmd-chip ${x.must ? "must" : ""}" data-copy="${x.cmd}">
        <span class="cmd-text">${x.must ? "⭐ " : ""}${x.cmd}</span>
        <span class="cmd-desc">${x.desc}</span>
        <span class="cmd-copy">คัดลอก</span>
      </button>`).join("");
    wrap.innerHTML = chips || `<div class="cmd-empty">— ไม่มีคำสั่งในกลุ่มนี้ —</div>`;
    document.querySelectorAll(".cmd-toggle .ct").forEach(b =>
      b.classList.toggle("active", b.dataset.cmdfilter === cmdFilter));
  }

  /* ---------- modal ---------- */
  function openModal(id) {
    const p = D.plugins.find(x => x.id === id);
    if (!p) return;
    currentPlugin = p; cmdFilter = "must";
    const c = cat(p.cat);
    const all = p.commands || [];
    const mustN = all.filter(x => x.must).length;
    const feats = (p.features || []).map(f => `<li>${f}</li>`).join("");
    const intg = (p.integrations || []).map(it => `
      <div class="row"><div class="with">${it.with}</div><div class="ex">${it.text}</div></div>`).join("");

    const cmdToggle = all.length ? `
      <div class="cmd-toggle">
        <button class="ct active" data-cmdfilter="must">⭐ ที่ต้องรู้ (${mustN})</button>
        <button class="ct" data-cmdfilter="all">ทั้งหมด (${all.length})</button>
      </div>` : "";

    $("#modal").innerHTML = `
      <div class="modal-head">
        <div class="ico">${p.icon}</div>
        <div><h2>${p.name}</h2><div class="ver">v${p.version} • ${c.label}</div></div>
        <button class="close-btn" data-close>×</button>
      </div>
      <div class="modal-body">
        <p class="what">${p.what}</p>

        <div class="block-title"><span class="bar" style="background:${c.color}"></span>ทำอะไรได้บ้าง</div>
        <ul class="feat">${feats}</ul>

        <div class="block-title"><span class="bar" style="background:${c.color}"></span>
          คำสั่ง <small class="muted">(กดที่คำสั่งเพื่อคัดลอก)</small></div>
        ${cmdToggle}
        <div class="cmd-list" id="cmdWrap"></div>

        <div class="block-title"><span class="bar" style="background:${c.color}"></span>เชื่อมกับปลั๊กอินตัวอื่นยังไง</div>
        <div class="intg">${intg}</div>
      </div>`;
    renderCommands();
    $("#overlay").classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#overlay").classList.remove("show");
    document.body.style.overflow = "";
    currentPlugin = null;
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".cmd-chip");
    if (chip) { copyText(chip.dataset.copy); return; }

    const ct = e.target.closest(".ct");
    if (ct) { cmdFilter = ct.dataset.cmdfilter; renderCommands(); return; }

    const card = e.target.closest(".card");
    if (card) return openModal(card.dataset.id);

    const fb = e.target.closest(".fbtn");
    if (fb) {
      activeCat = fb.dataset.cat;
      document.querySelectorAll(".fbtn").forEach(b => b.classList.toggle("active", b === fb));
      renderGrid(); return;
    }
    if (e.target.closest("[data-close]") || e.target.id === "overlay") closeModal();
    if (e.target.closest("[data-cfgclose]") || e.target.id === "cfgOverlay") closeConfig();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeConfig(); } });

  $("#footer").innerHTML = `รวบรวมจากเซิฟจริง • แก้ข้อมูลที่ <b>data.js</b> ไฟล์เดียว • ดูแลโดย Claude Code`;

  renderHero(); initPanel(); renderFilters(); renderGrid(); renderPlanned(); renderFlows();
})();
