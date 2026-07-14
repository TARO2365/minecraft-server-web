/* ============================================================
   Web Panel Backend — ควบคุมเซิร์ฟ Minecraft จากหน้าเว็บ
   ใช้ Node.js ล้วน ไม่ต้องลง package อะไรเพิ่ม (zero dependency)

   วิธีรัน:  node server.js   (หรือดับเบิลคลิก start-web.bat)
   แล้วเปิด http://localhost:8765

   ทำอะไรได้:
   - เสิร์ฟหน้าเว็บ (index.html + data.js + app.js + styles.css)
   - POST /api/start   → สตาร์ทเซิร์ฟ Minecraft (อ่านคำสั่ง java จาก start.bat)
   - POST /api/stop    → สั่ง stop อย่างปลอดภัย (พิมพ์ stop ลง console ให้เซฟโลกก่อนปิด)
   - POST /api/command → ส่งคำสั่ง console เช่น say, whitelist
   - GET  /api/status  → เซิร์ฟรันอยู่ไหม (แยก "เปิดจากเว็บ" กับ "เปิดจากข้างนอก")
   - GET  /api/logs    → stream log สดจาก logs/latest.log (SSE)

   ความปลอดภัย: bind เฉพาะ 127.0.0.1 — เข้าได้จากเครื่องนี้เท่านั้น
   ============================================================ */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawn, execFile } = require("child_process");

/* ---------- ตั้งค่า ---------- */
const PORT = 8765;
const HOST = "0.0.0.0";        // 0.0.0.0 = เปิดรับจากเครื่องอื่นในวง LAN/Wi-Fi (เช่น tablet) / เปลี่ยนกลับเป็น "127.0.0.1" ถ้าอยากล็อกเฉพาะเครื่องนี้
const PANEL_PIN = "741205";    // PIN สำหรับเครื่องอื่นที่ไม่ใช่คอมเครื่องนี้ — แก้ได้ตามใจ / ตั้งเป็น "" = ปิดระบบ PIN
const WEB_DIR = __dirname;
const SERVER_DIR = "C:\\Users\\Taro\\OneDrive\\เดสก์ท็อป\\server new";
const LOG_FILE = path.join(SERVER_DIR, "logs", "latest.log");
const START_BAT = path.join(SERVER_DIR, "start.bat");
const SERVER_PROPS = path.join(SERVER_DIR, "server.properties");
const RANKS_FILE = path.join(WEB_DIR, "ranks.json");
const IA_NAMESPACE = "oneblock";
const IA_DIR = path.join(SERVER_DIR, "plugins", "ItemsAdder", "contents", IA_NAMESPACE);
const IA_ITEMS_YML = path.join(IA_DIR, "configs", "items.yml");
const IA_TEXTURE_DIR = path.join(IA_DIR, "resourcepack", "assets", IA_NAMESPACE, "textures", "item");
/* ค่าลับ — ห้ามส่งขึ้นหน้าเว็บและห้ามแก้ผ่านเว็บ */
const SECRET_KEYS = ["rcon.password", "management-server-secret", "management-server-tls-keystore-password"];

/* ---------- สถานะ ---------- */
let mcProcess = null;      // process ที่เว็บเป็นคนเปิด (ควบคุมได้เต็มที่)
let mcStartedAt = null;
let stopping = false;

/* อ่านคำสั่ง java จาก start.bat — แก้ jar ใน start.bat แล้วเว็บใช้ตามอัตโนมัติ */
function readJavaArgs() {
  try {
    const txt = fs.readFileSync(START_BAT, "utf8");
    const m = txt.match(/java\s+(.+)/i);
    if (m) return m[1].trim().split(/\s+/);
  } catch (e) { /* ใช้ค่า fallback ข้างล่าง */ }
  return ["-Xmx4G", "-Xms4G", "-jar", "paper-1.21.11-130.jar", "nogui"];
}

/* เช็กว่ามี java รันอยู่ในเครื่องไหม (กรณีเปิดจากหน้าต่าง CMD เอง ไม่ผ่านเว็บ) */
function checkExternalJava(cb) {
  execFile("tasklist", ["/FI", "IMAGENAME eq java.exe", "/FO", "CSV", "/NH"], (err, out) => {
    if (err) return cb(false);
    cb(/java\.exe/i.test(out || ""));
  });
}

/* ---------- SSE: stream log สด ---------- */
const sseClients = new Set();
const logBuffer = [];            // เก็บ log ล่าสุดไว้โชว์ตอนเพิ่งเปิดหน้าเว็บ
const LOG_BUFFER_MAX = 400;

function pushLog(line, type) {
  const msg = JSON.stringify({ line, type: type || "log" });
  logBuffer.push(msg);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();
  for (const res of sseClients) res.write(`data: ${msg}\n\n`);
}
function pushSystem(line) { pushLog(line, "system"); }

/* ตามอ่าน logs/latest.log — ใช้ได้แม้เซิร์ฟถูกเปิดจากข้างนอก */
let logOffset = -1;   // -1 = ยังไม่ initial (เริ่มจากท้ายไฟล์)
let logCarry = "";
function pollLog() {
  fs.stat(LOG_FILE, (err, st) => {
    if (err) { logOffset = -1; return; }
    if (logOffset === -1) {
      // เปิดครั้งแรก: อ่านย้อนหลังนิดหน่อย (~16KB สุดท้าย) ให้เห็นบริบท
      logOffset = Math.max(0, st.size - 16384);
    }
    if (st.size < logOffset) { logOffset = 0; logCarry = ""; pushSystem("— log ไฟล์ใหม่ (เซิร์ฟรีสตาร์ท/ตัดไฟล์) —"); }
    if (st.size === logOffset) return;
    const stream = fs.createReadStream(LOG_FILE, { start: logOffset, end: st.size - 1, encoding: "utf8" });
    let chunk = "";
    stream.on("data", (d) => (chunk += d));
    stream.on("end", () => {
      logOffset = st.size;
      const text = logCarry + chunk;
      const lines = text.split(/\r?\n/);
      logCarry = lines.pop() || "";   // บรรทัดสุดท้ายอาจยังเขียนไม่จบ เก็บไว้ต่อรอบหน้า
      for (const l of lines) if (l.trim()) pushLog(l);
    });
    stream.on("error", () => {});
  });
}
setInterval(pollLog, 700);

/* ---------- ควบคุมเซิร์ฟ ---------- */
function startServer(cb) {
  if (mcProcess) return cb({ ok: false, error: "เซิร์ฟกำลังรันอยู่แล้ว (เปิดจากเว็บ)" });
  checkExternalJava((external) => {
    if (external) return cb({ ok: false, error: "มี java รันอยู่แล้ว — เซิร์ฟน่าจะถูกเปิดจากหน้าต่าง CMD อยู่ ปิดตัวนั้นก่อนถ้าจะรันจากเว็บ" });
    const args = readJavaArgs();
    pushSystem(`▶ สตาร์ทเซิร์ฟ: java ${args.join(" ")}`);
    try {
      mcProcess = spawn("java", args, { cwd: SERVER_DIR, stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      return cb({ ok: false, error: "สตาร์ทไม่ได้: " + e.message });
    }
    mcStartedAt = Date.now();
    stopping = false;
    // log หลักอ่านจากไฟล์อยู่แล้ว — stdout เอาไว้จับ error ตอน java เปิดไม่ติด (ก่อนมี log file)
    mcProcess.stderr.on("data", (d) => {
      const s = d.toString().trim();
      if (s) pushLog(s, "stderr");
    });
    mcProcess.on("exit", (code) => {
      pushSystem(stopping ? "■ เซิร์ฟปิดเรียบร้อย" : `■ เซิร์ฟหยุดทำงาน (exit code ${code})`);
      mcProcess = null; mcStartedAt = null; stopping = false;
    });
    mcProcess.on("error", (e) => {
      pushSystem("✖ สตาร์ทไม่ได้: " + e.message);
      mcProcess = null; mcStartedAt = null;
    });
    cb({ ok: true });
  });
}

function stopServer(cb) {
  if (!mcProcess) return cb({ ok: false, error: "เว็บไม่ได้เป็นคนเปิดเซิร์ฟตัวนี้ — ถ้าเปิดจากหน้าต่าง CMD ให้พิมพ์ stop ในหน้าต่างนั้น (ห้าม kill process เดี๋ยวโลกไม่เซฟ)" });
  stopping = true;
  pushSystem("⏹ สั่งปิดเซิร์ฟ (stop) — รอเซฟโลกก่อน...");
  mcProcess.stdin.write("stop\n");
  cb({ ok: true });
}

/* ---------- RCON: ส่งคำสั่งเข้าเซิร์ฟได้แม้ถูกเปิดจากหน้าต่าง CMD ---------- */
function readRconSettings() {
  try {
    const txt = fs.readFileSync(SERVER_PROPS, "utf8");
    const get = (k) => (txt.match(new RegExp("^" + k.replace(/\./g, "\\.") + "=(.*)$", "m")) || [])[1] || "";
    return { enabled: get("enable-rcon") === "true", port: parseInt(get("rcon.port")) || 25575, password: get("rcon.password") };
  } catch (e) { return { enabled: false }; }
}

/* ส่งชุดคำสั่งผ่าน RCON ตามลำดับ คืน log คำตอบของแต่ละคำสั่ง */
function rconExec(cmds, cb) {
  const rc = readRconSettings();
  if (!rc.enabled || !rc.password) return cb({ ok: false, error: "RCON ไม่ได้เปิดใน server.properties" });
  const sock = net.createConnection({ host: "127.0.0.1", port: rc.port });
  const results = [];
  let buf = Buffer.alloc(0);
  let step = -1; // -1 = รอ auth
  let finished = false;
  const done = (r) => { if (!finished) { finished = true; sock.destroy(); cb(r); } };
  const timer = setTimeout(() => done({ ok: false, error: "RCON timeout" }), 15000);

  function packet(id, type, body) {
    const b = Buffer.from(body, "utf8");
    const p = Buffer.alloc(14 + b.length);
    p.writeInt32LE(10 + b.length, 0); p.writeInt32LE(id, 4); p.writeInt32LE(type, 8);
    b.copy(p, 12);
    return p;
  }
  function next() {
    step++;
    if (step >= cmds.length) { clearTimeout(timer); return done({ ok: true, log: results }); }
    sock.write(packet(step + 10, 2, cmds[step]));
  }
  sock.on("connect", () => sock.write(packet(1, 3, rc.password)));
  sock.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    while (buf.length >= 4) {
      const len = buf.readInt32LE(0);
      if (buf.length < 4 + len) break;
      const id = buf.readInt32LE(4);
      const body = buf.toString("utf8", 12, 4 + len - 2);
      buf = buf.slice(4 + len);
      if (step === -1) {
        if (id === -1) { clearTimeout(timer); return done({ ok: false, error: "รหัส RCON ไม่ถูกต้อง" }); }
        next();
      } else {
        results.push({ cmd: cmds[step], reply: body.replace(/§./g, "") });
        next();
      }
    }
  });
  sock.on("error", () => { clearTimeout(timer); done({ ok: false, error: "ต่อ RCON ไม่ได้ — เซิร์ฟออฟไลน์อยู่ เปิดเซิร์ฟก่อน" }); });
}

function sendCommand(cmd, cb) {
  const clean = String(cmd || "").trim().replace(/^\//, "");
  if (!clean) return cb({ ok: false, error: "คำสั่งว่าง" });
  if (mcProcess) {
    pushLog("> " + clean, "input");
    mcProcess.stdin.write(clean + "\n");
    return cb({ ok: true });
  }
  /* เซิร์ฟถูกเปิดจากข้างนอก — ยิงผ่าน RCON แทน */
  rconExec([clean], (r) => {
    if (r.ok) {
      pushLog("> " + clean + "  (ผ่าน RCON)", "input");
      const reply = (r.log[0] || {}).reply;
      if (reply) pushLog(reply, "log");
    }
    cb(r.ok ? { ok: true } : r);
  });
}

/* ---------- HTTP ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

/* เครื่องนี้เอง (localhost) ไม่ต้องใส่ PIN — เครื่องอื่นใน LAN ต้องใส่ */
function authed(req, url) {
  if (!PANEL_PIN) return true;
  const ip = req.socket.remoteAddress || "";
  if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") return true;
  return req.headers["x-pin"] === PANEL_PIN || url.searchParams.get("pin") === PANEL_PIN;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  /* --- API (ทุกเส้นทางต้องผ่าน PIN ถ้ามาจากเครื่องอื่น) --- */
  if (p.startsWith("/api/") && !authed(req, url)) {
    return json(res, 401, { ok: false, error: "ต้องใส่ PIN (ดูค่า PANEL_PIN ในไฟล์ server.js หรือหน้าต่าง CMD ของเว็บ)" });
  }
  if (p === "/api/status") {
    if (mcProcess) return json(res, 200, { running: true, owned: true, uptimeSec: Math.floor((Date.now() - mcStartedAt) / 1000) });
    return checkExternalJava((ext) => json(res, 200, { running: ext, owned: false, uptimeSec: null }));
  }
  if (p === "/api/start" && req.method === "POST") return startServer((r) => json(res, r.ok ? 200 : 409, r));
  if (p === "/api/stop" && req.method === "POST") return stopServer((r) => json(res, r.ok ? 200 : 409, r));
  if (p === "/api/command" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      let cmd = "";
      try { cmd = JSON.parse(body).cmd; } catch (e) {}
      sendCommand(cmd, (r) => json(res, r.ok ? 200 : 409, r));
    });
    return;
  }
  /* --- ตั้งค่าเซิร์ฟ (server.properties) --- */
  if (p === "/api/config" && req.method === "GET") {
    try {
      const txt = fs.readFileSync(SERVER_PROPS, "utf8");
      const config = {};
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^([A-Za-z0-9._-]+)=(.*)$/);
        if (m && !SECRET_KEYS.includes(m[1])) config[m[1]] = m[2];
      }
      return json(res, 200, { ok: true, config });
    } catch (e) { return json(res, 500, { ok: false, error: "อ่าน server.properties ไม่ได้: " + e.message }); }
  }
  if (p === "/api/config" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      let changes = {};
      try { changes = JSON.parse(body).changes || {}; } catch (e) {}
      try {
        let txt = fs.readFileSync(SERVER_PROPS, "utf8");
        const applied = [];
        for (const [k, v] of Object.entries(changes)) {
          if (SECRET_KEYS.includes(k)) continue;                      // ค่าลับ แก้ผ่านเว็บไม่ได้
          const val = String(v).replace(/[\r\n]/g, "");               // กันยัดหลายบรรทัด
          const re = new RegExp("^" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=.*$", "m");
          if (re.test(txt)) { txt = txt.replace(re, () => k + "=" + val); applied.push(k); }
        }
        if (applied.length) {
          fs.writeFileSync(SERVER_PROPS, txt);
          pushSystem("⚙ แก้ config: " + applied.join(", ") + " — มีผลตอนรีสตาร์ทเซิร์ฟ");
        }
        json(res, 200, { ok: true, applied });
      } catch (e) { json(res, 500, { ok: false, error: "เขียนไฟล์ไม่ได้: " + e.message }); }
    });
    return;
  }

  /* --- ระบบยศ (LuckPerms ผ่าน RCON) --- */
  if (p === "/api/ranks" && req.method === "GET") {
    try {
      const data = JSON.parse(fs.readFileSync(RANKS_FILE, "utf8"));
      return json(res, 200, { ok: true, data });
    } catch (e) { return json(res, 500, { ok: false, error: "อ่าน ranks.json ไม่ได้: " + e.message }); }
  }
  if (p.startsWith("/api/ranks/") && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      let b = {};
      try { b = JSON.parse(body); } catch (e) {}
      const action = p.slice("/api/ranks/".length);

      /* บันทึกข้อมูลยศ/preset ลงไฟล์ (ยังไม่ยิงเข้าเซิร์ฟ) */
      if (action === "save") {
        if (!b.data || !Array.isArray(b.data.ranks) || typeof b.data.presets !== "object")
          return json(res, 400, { ok: false, error: "ข้อมูลไม่ครบ" });
        fs.writeFileSync(RANKS_FILE, JSON.stringify(b.data, null, 2));
        return json(res, 200, { ok: true });
      }

      const data = JSON.parse(fs.readFileSync(RANKS_FILE, "utf8"));

      /* ยิงยศเข้าเซิร์ฟแบบ realtime */
      if (action === "apply") {
        const r = data.ranks.find((x) => x.id === b.rankId);
        if (!r) return json(res, 404, { ok: false, error: "ไม่พบยศ " + b.rankId });
        const perms = new Set();
        (r.presets || []).forEach((pn) => (data.presets[pn] || { perms: [] }).perms.forEach((x) => perms.add(x)));
        (r.extra || []).forEach((x) => x.trim() && perms.add(x.trim()));
        const prefix = `&8[${r.color}${r.icon} ${r.display}&8]&r `;
        const cmds = [
          `lp creategroup ${r.id}`,
          `lp group ${r.id} setweight ${r.weight}`,
          `lp group ${r.id} meta setprefix ${r.weight} "${prefix}"`,
          ...[...perms].map((x) => `lp group ${r.id} permission set ${x} true`)
        ];
        return rconExec(cmds, (out) => {
          if (out.ok) pushSystem(`🎖 อัปเดตยศ "${r.display}" (${r.id}) เข้าเซิร์ฟแล้ว — สิทธิ์ ${perms.size} รายการ`);
          json(res, out.ok ? 200 : 502, out);
        });
      }

      /* ลบยศออกจากเซิร์ฟ + ไฟล์ */
      if (action === "delete") {
        const idx = data.ranks.findIndex((x) => x.id === b.rankId);
        if (idx < 0) return json(res, 404, { ok: false, error: "ไม่พบยศ" });
        const removed = data.ranks.splice(idx, 1)[0];
        fs.writeFileSync(RANKS_FILE, JSON.stringify(data, null, 2));
        return rconExec([`lp deletegroup ${removed.id}`], (out) => {
          pushSystem(`🗑 ลบยศ "${removed.display}" ${out.ok ? "ออกจากเซิร์ฟแล้ว" : "(จากไฟล์ — เซิร์ฟออฟไลน์ ค่อยลบซ้ำตอนออนไลน์)"}`);
          json(res, 200, { ok: true, serverApplied: out.ok });
        });
      }

      /* ตั้งยศให้ผู้เล่น */
      if (action === "assign") {
        const player = String(b.player || "").trim();
        if (!player || !b.rankId) return json(res, 400, { ok: false, error: "ใส่ชื่อผู้เล่นและเลือกยศก่อน" });
        return rconExec([`lp user ${player} parent set ${b.rankId}`], (out) => {
          if (out.ok) pushSystem(`🎖 ตั้งยศ ${b.rankId} ให้ ${player} แล้ว`);
          json(res, out.ok ? 200 : 502, out);
        });
      }

      json(res, 404, { ok: false, error: "ไม่รู้จักคำสั่ง " + action });
    });
    return;
  }

  /* --- 🎨 สร้างไอเทม ItemsAdder --- */
  if (p === "/api/items" && req.method === "GET") {
    try {
      const txt = fs.existsSync(IA_ITEMS_YML) ? fs.readFileSync(IA_ITEMS_YML, "utf8") : "";
      const items = [];
      const matches = [...txt.matchAll(/^  ([a-z0-9_]+):[ \t]*$/gm)];
      matches.forEach((m, i) => {
        const id = m[1];
        const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
        const block = txt.slice(m.index, end);
        const dn = (block.match(/display_name:\s*'([^']+)'/) || block.match(/display_name:\s*(.+)/) || [])[1] || id;
        const hasTexture = fs.existsSync(path.join(IA_TEXTURE_DIR, id + ".png"));
        const mat = (block.match(/material:\s*(\w+)/) || [])[1] || "?";
        items.push({ id, displayName: dn, material: mat, hasTexture });
      });
      return json(res, 200, { ok: true, namespace: IA_NAMESPACE, items });
    } catch (e) { return json(res, 500, { ok: false, error: e.message }); }
  }
  if (p.startsWith("/ia-texture/")) {
    const name = path.basename(p).replace(/[^a-z0-9_.]/g, "");
    const f = path.join(IA_TEXTURE_DIR, name);
    if (fs.existsSync(f)) { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(fs.readFileSync(f)); }
    res.writeHead(404); return res.end();
  }
  if (p === "/api/items/create" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      try {
        const b = JSON.parse(body);
        const id = String(b.id || "").trim().toLowerCase();
        if (!/^[a-z0-9_]{2,32}$/.test(id)) return json(res, 400, { ok: false, error: "รหัสไอเทมต้องเป็น a-z/0-9/_ ยาว 2-32 ตัว" });
        let yml = fs.readFileSync(IA_ITEMS_YML, "utf8");
        if (new RegExp("^  " + id + ":", "m").test(yml)) return json(res, 409, { ok: false, error: `มีไอเทม ${id} อยู่แล้ว — ใช้รหัสอื่น` });

        /* texture (ถ้ามี) — รับเป็น base64 png */
        let hasTexture = false;
        if (b.textureBase64) {
          const data = Buffer.from(b.textureBase64.replace(/^data:image\/png;base64,/, ""), "base64");
          if (data.length > 512 * 1024) return json(res, 400, { ok: false, error: "รูปใหญ่เกิน 512KB — texture ควรเป็น png เล็กๆ เช่น 16x16 หรือ 32x32" });
          fs.mkdirSync(IA_TEXTURE_DIR, { recursive: true });
          fs.writeFileSync(path.join(IA_TEXTURE_DIR, id + ".png"), data);
          hasTexture = true;
        }

        /* ประกอบ YAML block ตามรูปแบบ ItemsAdder 4.x */
        const esc1 = (s) => String(s || "").replace(/'/g, "''");
        const lines = [];
        lines.push(`  ${id}:`);
        lines.push(`    enabled: true`);
        lines.push(`    display_name: '${esc1((b.color || "&f") + b.displayName)}'`);
        const lore = (b.lore || []).map((x) => x.trim()).filter(Boolean);
        if (lore.length) {
          lines.push(`    lore:`);
          lore.forEach((l) => lines.push(`      - '&7${esc1(l)}'`));
        }
        lines.push(`    resource:`);
        lines.push(`      material: ${/^[A-Z_]+$/.test(b.material || "") ? b.material : "PAPER"}`);
        if (hasTexture) {
          lines.push(`      generate: true`);
          lines.push(`      textures:`);
          lines.push(`        - item/${id}`);
        } else {
          lines.push(`      generate: false`);
        }
        const st = b.stats || {};
        const mods = [];
        if (+st.damage) mods.push(`        attackDamage: ${+st.damage}`);
        if (+st.speed) mods.push(`        attackSpeed: ${+st.speed}`);
        if (+st.health) mods.push(`        maxHealth: ${+st.health}`);
        if (mods.length) {
          lines.push(`    attribute_modifiers:`);
          lines.push(`      mainhand:`);
          lines.push(...mods);
        }
        yml = yml.replace(/\s*$/, "\n") + "\n" + lines.join("\n") + "\n";
        fs.writeFileSync(IA_ITEMS_YML, yml);
        pushSystem(`🎨 สร้างไอเทม ${IA_NAMESPACE}:${id} แล้ว — กด "อัปเดต pack" เพื่อให้มีผลในเกม`);
        json(res, 200, { ok: true, id, full: `${IA_NAMESPACE}:${id}`, hasTexture });
      } catch (e) { json(res, 500, { ok: false, error: e.message }); }
    });
    return;
  }
  if (p === "/api/items/reload" && req.method === "POST") {
    return rconExec(["iazip"], (out) => {
      if (out.ok) pushSystem("📦 สั่งอัปเดต resource pack (iazip) แล้ว — รอสักครู่ ผู้เล่นในเซิร์ฟจะได้รับ pack ใหม่");
      json(res, out.ok ? 200 : 502, out);
    });
  }

  /* --- 🧍 สร้าง NPC (Citizens ผ่าน RCON) --- */
  if (p === "/api/worlds" && req.method === "GET") {
    try {
      const worlds = fs.readdirSync(SERVER_DIR).filter((d) => {
        try { return fs.existsSync(path.join(SERVER_DIR, d, "level.dat")); } catch (e) { return false; }
      });
      return json(res, 200, { ok: true, worlds });
    } catch (e) { return json(res, 500, { ok: false, error: e.message }); }
  }
  if (p === "/api/npc/playerpos" && req.method === "POST") {
    return rconExec(["data get entity Oxygenlave Pos"], (out) => {
      if (!out.ok) return json(res, 502, out);
      const m = ((out.log[0] || {}).reply || "").match(/\[(-?[\d.]+)d?,\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?\]/);
      if (!m) return json(res, 404, { ok: false, error: "หาตำแหน่งไม่เจอ — Oxygenlave ต้องออนไลน์อยู่ในเกม" });
      json(res, 200, { ok: true, x: Math.round(+m[1] * 10) / 10, y: Math.round(+m[2] * 10) / 10, z: Math.round(+m[3] * 10) / 10 });
    });
  }
  if (p === "/api/npc/create" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      let b = {};
      try { b = JSON.parse(body); } catch (e) {}
      const name = String(b.name || "").trim();
      if (!name) return json(res, 400, { ok: false, error: "ตั้งชื่อ NPC ก่อน" });
      const { x, y, z, world } = b.pos || {};
      if ([x, y, z].some((v) => v === undefined || v === "") || !world) return json(res, 400, { ok: false, error: "ใส่ตำแหน่ง x y z และเลือกโลกก่อน" });
      const cmds = [`npc create ${name.replace(/ /g, "_")} --at ${x}:${y}:${z}:${world}`];
      if (b.skin) cmds.push(`npc skin ${String(b.skin).trim()}`);
      if (b.lookclose) cmds.push(`npc lookclose`);
      if (b.command) cmds.push(`npc command add ${String(b.command).trim().replace(/^\//, "")}`);
      rconExec(cmds, (out) => {
        if (out.ok) pushSystem(`🧍 สร้าง NPC "${name}" ที่ ${world} (${x}, ${y}, ${z}) แล้ว`);
        json(res, out.ok ? 200 : 502, out);
      });
    });
    return;
  }

  if (p === "/api/logs") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(":ok\n\n");
    for (const msg of logBuffer) res.write(`data: ${msg}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  /* --- static files --- */
  let file = p === "/" ? "/index.html" : p;
  file = path.normalize(file).replace(/^([.\\/])+/, "");
  const full = path.join(WEB_DIR, file);
  if (!full.startsWith(WEB_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("404"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  ✔ Web Panel พร้อมใช้:  http://localhost:" + PORT);
  if (HOST === "0.0.0.0") {
    const nets = require("os").networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const n of nets[name]) {
        if (n.family === "IPv4" && !n.internal) console.log("  ✔ จากเครื่องอื่นใน LAN:  http://" + n.address + ":" + PORT + "  (" + name + ")");
      }
    }
    console.log("  ✔ PIN สำหรับเครื่องอื่น: " + (PANEL_PIN || "(ปิดอยู่ — ไม่ต้องใส่)"));
  }
  console.log("  ✔ โฟลเดอร์เซิร์ฟ:      " + SERVER_DIR);
  console.log("  (ปิดหน้าต่างนี้ = ปิดเว็บ panel — เซิร์ฟ Minecraft ไม่ดับตาม ถ้าเปิดจากข้างนอก)");
  console.log("");
});
