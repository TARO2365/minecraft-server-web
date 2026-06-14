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

  /* ---------- คอนโซล Claude Code ---------- */
  function renderConsole() {
    const s = D.server;
    const lines = [
      `<span class="pmt">claude@minecraft-server</span> <span class="dim">~/server new$</span> สรุปสถานะเซิฟ`,
      `<span class="ok">✔</span> แกน: ${s.core} • ${s.java}`,
      `<span class="ok">✔</span> ปลั๊กอินทั้งหมด: ${D.plugins.length} กลุ่ม (BentoBox + 16 addons, MythicMobs, AuraSkills ฯลฯ)`,
      `<span class="ok">✔</span> บูตล่าสุด: Done ${s.bootTime} — ไม่มีพอร์ตชน`,
      `<span class="warn">⚠</span> cs.yml (เช็ก) ของ Chat addon ผิดรูป — ไม่กระทบการรัน`,
      `<span class="dim">// ${s.note}</span>`,
      `<span class="pmt">claude@minecraft-server</span> <span class="dim">~/server new$</span> <span class="cursor"></span>`
    ];
    const el = $("#console"); el.innerHTML = "";
    let i = 0;
    (function typeLine() {
      if (i >= lines.length) return;
      const div = document.createElement("div");
      div.innerHTML = lines[i]; el.appendChild(div); i++;
      setTimeout(typeLine, 380);
    })();
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

  renderHero(); renderConsole(); renderFilters(); renderGrid();
})();
