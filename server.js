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

function sendCommand(cmd, cb) {
  if (!mcProcess) return cb({ ok: false, error: "ส่งคำสั่งได้เฉพาะเซิร์ฟที่กด Run จากเว็บ (ตัวที่รันอยู่ถูกเปิดจากข้างนอก)" });
  const clean = String(cmd || "").trim().replace(/^\//, "");
  if (!clean) return cb({ ok: false, error: "คำสั่งว่าง" });
  pushLog("> " + clean, "input");
  mcProcess.stdin.write(clean + "\n");
  cb({ ok: true });
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
