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
      const r = await fetch("/api/status");
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
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
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
    // ปุ่มคำสั่งด่วน
    const quick = [
      ["list", "ใครออนบ้าง"], ["say สวัสดีชาวเซิฟ!", "ประกาศ"], ["spark tps", "เช็ก TPS"],
      ["whitelist list", "ดู whitelist"], ["save-all", "เซฟโลกเดี๋ยวนี้"]
    ];
    $("#quickCmds").innerHTML = `<span class="qlabel">คำสั่งด่วน:</span>` + quick.map(([c, l]) =>
      `<button class="qcmd" data-qcmd="${c}">${l} <code>/${c.split(" ")[0]}</code></button>`).join("");

    // ต่อ log stream (SSE)
    try {
      const es = new EventSource("/api/logs");
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
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  $("#footer").innerHTML = `รวบรวมจากเซิฟจริง • แก้ข้อมูลที่ <b>data.js</b> ไฟล์เดียว • ดูแลโดย Claude Code`;

  renderHero(); initPanel(); renderFilters(); renderGrid(); renderPlanned(); renderFlows();
})();
