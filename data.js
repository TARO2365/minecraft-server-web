/* ============================================================
   ข้อมูลเซิร์ฟเวอร์ + ปลั๊กอิน (ภาษาไทย)
   แก้ที่ไฟล์นี้ไฟล์เดียว — หน้าเว็บดึงไปแสดงอัตโนมัติ
   ตรวจจากเซิฟจริง: 2026-07-08 (Paper 1.21.11 build 130 — หลังลบปลั๊กอินซ้ำ)

   commands: [{ cmd, desc, must:true=คำสั่งที่ต้องรู้ }]
   integrations: [{ with, text }]
   ============================================================ */

window.MC = {

  /* ---------- รายละเอียดเซิร์ฟเวอร์ ---------- */
  server: {
    name: "เซิร์ฟเวอร์ OneBlock RPG",
    tagline: "MMORPG Hub + OneBlock เป็นบ้านส่วนตัว (ธีมแรงบันดาลใจ Ragnarok)",
    core: "Paper 1.21.11 (build 130)",
    mc: "Minecraft 1.21.11",
    java: "Java 24 (JDK 24 — Paper ต้องการ 21+)",
    ram: "4 GB (Xmx/Xms 4G)",
    address: "localhost:25565",
    op: "Oxygenlave",
    github: "https://github.com/TARO2365/minecraft-server",
    bootTime: "~38 วินาที (ตรวจ 2026-07-08)",
    note: "ดูแล/แก้ไขผ่าน Claude Code (ชัคกี้ CCO + subagent: researcher / docs-thai / installer / verifier)"
  },

  /* ---------- หมวดหมู่ (สีการ์ด) ---------- */
  categories: {
    island:  { label: "ระบบเกาะ / OneBlock", color: "#2f80ed" },
    rpg:     { label: "RPG / สกิล / มอนสเตอร์", color: "#f2994a" },
    economy: { label: "เมนู / ร้านค้า / เศรษฐกิจ", color: "#27ae60" },
    display: { label: "แสดงผล / ตกแต่ง", color: "#9b51e0" },
    admin:   { label: "สิทธิ์ / จัดการผู้เล่น", color: "#eb5757" },
    world:   { label: "โลก / แก้ไข / ป้องกัน", color: "#2d4059" },
    util:    { label: "เสริม / หลังบ้าน", color: "#f2c94c" }
  },

  /* ---------- ปลั๊กอิน ---------- */
  plugins: [
    {
      id: "bentobox",
      name: "BentoBox + AOneBlock",
      version: "3.17.0 / AOneBlock 1.25.0",
      cat: "island",
      icon: "🧱",
      tagline: "หัวใจของเซิฟ — ระบบเกาะ OneBlock ทั้งหมด",
      what: "BentoBox คือเอนจินจัดการเกาะ (Skyblock framework) ส่วน AOneBlock ทำโหมด OneBlock — เริ่มจากบล็อกเดียว ทุบแล้วเกิดบล็อกใหม่ไล่เฟสไปเรื่อยๆ จนได้ของหายาก เซิฟนี้ลง addon เสริม 16 ตัว (Level, Challenges, Warps, Limits, Bank, Biomes, Border, Greenhouses, MagicCobblestoneGenerator, ControlPanel, Likes, IslandFly, CheckMeOut, FarmersDance, Chat)",
      features: [
        "สร้าง/รีเซ็ตเกาะส่วนตัว + ชวนเพื่อนร่วมเกาะ (team)",
        "ระบบเฟส OneBlock — บล็อกเปลี่ยนตามความคืบหน้า",
        "Level = คิดเลเวลเกาะ, Challenges = เควสต์, Limits = จำกัดบล็อก/มอบกันแลค",
        "Bank = ธนาคารเกาะ, Biomes = ซื้อไบโอม, Warps = วาร์ปหาเกาะคนอื่น"
      ],
      commands: [
        { cmd: "/island", desc: "เปิดเมนูเกาะหลัก (ย่อ /is)", must: true },
        { cmd: "/is create", desc: "สร้างเกาะใหม่ของตัวเอง", must: true },
        { cmd: "/is go", desc: "วาร์ปกลับเกาะตัวเอง", must: true },
        { cmd: "/is level", desc: "เช็กเลเวลเกาะ", must: true },
        { cmd: "/is challenges", desc: "เปิดเมนูเควสต์/ภารกิจ", must: true },
        { cmd: "/is invite <ชื่อ>", desc: "ชวนเพื่อนมาร่วมเกาะ", must: false },
        { cmd: "/is sethome", desc: "ตั้งจุดเกิดบนเกาะ", must: false },
        { cmd: "/is warps", desc: "ดูรายการวาร์ปเกาะคนอื่น", must: false },
        { cmd: "/is biomes", desc: "ซื้อ/เปลี่ยนไบโอมบนเกาะ", must: false },
        { cmd: "/is settings", desc: "ตั้งค่าสิทธิ์/กฎบนเกาะ", must: false },
        { cmd: "/bbox reload", desc: "[แอดมิน] รีโหลด config BentoBox", must: false }
      ],
      integrations: [
        { with: "Level + DecentHolograms + PlaceholderAPI", text: "ทำป้ายโฮโลแกรมโชว์อันดับเลเวลเกาะ Top 10 ที่สปอว์น อัปเดตเอง" },
        { with: "Bank + Vault", text: "ธนาคารเกาะใช้เงินก้อนเดียวกับร้านค้าผ่าน Vault" },
        { with: "Challenges + EconomyShopGUI", text: "ทำเควสต์ให้รางวัลเป็นเงิน/ไอเทมที่ขายต่อในร้านได้" }
      ]
    },
    {
      id: "mythicmobs",
      name: "MythicMobs",
      version: "5.11.2",
      cat: "rpg",
      icon: "🐉",
      tagline: "สร้างมอนสเตอร์/บอสคัสตอม + สกิลพิเศษ",
      what: "ปลั๊กอินทำมอนสเตอร์เอง — กำหนด HP, สกิล, AI, ดรอป, อุปกรณ์ ได้ละเอียด เป็นฐานสำหรับบอสประจำเฟส OneBlock และต่อยอดเป็นมอนสเตอร์โมเดล 3D ได้ (เชื่อม ModelEngine). คำสั่งส่วนใหญ่เป็นฝั่งแอดมิน",
      features: [
        "ออกแบบมอนสเตอร์/บอสเองทุกค่า (HP, ดาเมจ, สกิล, AI)",
        "ระบบสกิล/เมคานิกซับซ้อน (ยิงกระสุน, AOE, เรียกลูกสมุน)",
        "ตั้ง drop table + spawner เองได้",
        "เชื่อมไอเทมคัสตอมของ ItemsAdder และโมเดลของ ModelEngine ได้"
      ],
      commands: [
        { cmd: "/mm", desc: "เมนูหลัก MythicMobs", must: true },
        { cmd: "/mm mobs spawn <ชื่อ> [จำนวน]", desc: "เสกมอนสเตอร์คัสตอมออกมา", must: true },
        { cmd: "/mm items get <ชื่อ>", desc: "รับไอเทมคัสตอมเข้ากระเป๋า", must: true },
        { cmd: "/mm reload", desc: "รีโหลด config ทั้งหมด", must: true },
        { cmd: "/mm mobs list", desc: "ดูรายชื่อมอนสเตอร์ทั้งหมด", must: false },
        { cmd: "/mm items list", desc: "ดูรายชื่อไอเทมทั้งหมด", must: false },
        { cmd: "/mm mobs kill <ชื่อ>", desc: "ฆ่ามอนสเตอร์ชนิดนั้นทั้งแมพ", must: false }
      ],
      integrations: [
        { with: "Vault", text: "ตั้งให้บอส/มอนสเตอร์ดรอปเงินเข้าระบบเศรษฐกิจตรงๆ" },
        { with: "ItemsAdder", text: "ให้มอนสเตอร์สวมใส่/ดรอปไอเทมคัสตอมของ ItemsAdder" },
        { with: "AOneBlock", text: "วางบอสประจำเฟส OneBlock ให้ผ่านก่อนไปเฟสถัดไป" },
        { with: "แผนโซนมิดกาเรีย", text: "ใช้สร้างมอน 4 ตัว + บอสลูนาเรกซ์ ของโซนแรก (ดู docs/zone-01-midgaria.md)" }
      ]
    },
    {
      id: "auraskills",
      name: "AuraSkills",
      version: "2.3.12",
      cat: "rpg",
      icon: "⚔️",
      tagline: "ระบบสกิล/เลเวลผู้เล่น (ขุด/สู้/ตกปลา ฯลฯ)",
      what: "ระบบ RPG skill — ผู้เล่นได้ XP จากกิจกรรม (ขุด, สู้, ฟาร์ม, ตกปลา) เลเวลขึ้นแล้วปลดล็อกความสามารถ/สเตตัส เหมาะกับสกายบล็อกที่เน้นขุด-เก็บ-โต",
      features: [
        "หลายสกิล: Mining, Farming, Foraging, Fighting, Fishing ฯลฯ",
        "ปลดล็อก ability/บัฟตามเลเวล (ดับเบิลดรอป, เพิ่มดาเมจ)",
        "มี stat (HP, ดาเมจ, ความเร็ว) ที่โตตามสกิล",
        "⚠ บล็อกคัสตอมของ ItemsAdder ขุดแล้วไม่ได้ XP สกิล (ข้อจำกัดที่ต้องเผื่อตอนออกแบบ)"
      ],
      commands: [
        { cmd: "/skills", desc: "เปิดเมนูสกิลทั้งหมด (ย่อ /sk)", must: true },
        { cmd: "/stats", desc: "ดูสเตตัสตัวเอง (HP/ดาเมจ ฯลฯ)", must: true },
        { cmd: "/skills top <สกิล>", desc: "ดูอันดับผู้เล่นในสกิลนั้น", must: false },
        { cmd: "/mana", desc: "เช็กมานาปัจจุบัน", must: false },
        { cmd: "/skills toggle <สกิล>", desc: "เปิด/ปิดการรับ XP สกิลนั้น", must: false },
        { cmd: "/auraskills xp add <ผู้เล่น> <สกิล> <จำนวน>", desc: "[แอดมิน] เพิ่ม XP ให้ผู้เล่น", must: false },
        { cmd: "/auraskills reload", desc: "[แอดมิน] รีโหลด config", must: false }
      ],
      integrations: [
        { with: "ItemsAdder", text: "⚠ ข้อจำกัด: บล็อกคัสตอมของ ItemsAdder ขุดแล้วไม่ได้ XP สกิล — ถ้าทำเหมือง/ฟาร์มคัสตอมต้องออกแบบเผื่อ" },
        { with: "Vault + EconomyShopGUI", text: "สกิลฟาร์มเพิ่มผลผลิต → ขายในร้านได้เงินมากขึ้น" },
        { with: "PlaceholderAPI", text: "ดึงเลเวลสกิลไปโชว์ในเมนู DeluxeMenus/โฮโลแกรม" }
      ]
    },
    {
      id: "deluxemenus",
      name: "DeluxeMenus",
      version: "1.14.1",
      cat: "economy",
      icon: "📋",
      tagline: "สร้างเมนู GUI คัสตอม (กดปุ่มสั่งงาน)",
      what: "ทำเมนูหน้าต่าง GUI เองได้อิสระ — แต่ละช่องสั่งคำสั่ง/เปิดเมนูอื่น/โชว์ข้อมูลผู้เล่น เหมาะทำเมนูหลัก, ร้านค้า, เมนูวาร์ป, โปรไฟล์",
      features: [
        "ออกแบบเมนู GUI เองทุกช่อง (ไอคอน/ชื่อ/lore)",
        "ปุ่มสั่ง command / เปิดเมนูซ้อน / ใส่เงื่อนไข (requirement)",
        "รองรับ PlaceholderAPI โชว์ค่าผู้เล่นสด",
        "ตั้ง alias เปิดเมนูเองได้ เช่น /menu"
      ],
      commands: [
        { cmd: "/dm open <ชื่อเมนู>", desc: "เปิดเมนูที่สร้างไว้", must: true },
        { cmd: "/dm list", desc: "ดูเมนูทั้งหมดที่มี", must: true },
        { cmd: "/dm reload", desc: "รีโหลดเมนูหลังแก้ไฟล์", must: true }
      ],
      integrations: [
        { with: "PlaceholderAPI + Vault", text: "เมนูโปรไฟล์โชว์เงิน/ยศ/เลเวลสกิลแบบเรียลไทม์" },
        { with: "AuraSkills + BentoBox", text: "เมนูหลักรวมปุ่ม: /skills, /is, ร้านค้า ไว้ที่เดียว" },
        { with: "EconomyShopGUI", text: "ปุ่ม 'ร้านค้า' ในเมนูเปิดร้าน EconomyShopGUI ต่อ" }
      ]
    },
    {
      id: "economyshopgui",
      name: "EconomyShopGUI",
      version: "7.0.4",
      cat: "economy",
      icon: "🛒",
      tagline: "ร้านค้ากลางแบบ GUI ซื้อ-ขายไอเทม",
      what: "ร้านค้าหน้าต่าง GUI พร้อมใช้ — ตั้งราคาซื้อ/ขายไอเทม มีหมวดหมู่ ผู้เล่นขายของที่ฟาร์ม/ขุดได้เลย เป็นแกนเศรษฐกิจของเซิฟ",
      features: [
        "ร้านค้า GUI แบ่งหมวด (พร้อมราคาตั้งต้น)",
        "ตั้งราคาซื้อ/ขายต่อไอเทมได้",
        "รองรับราคาผันผวนตามดีมานด์ (dynamic pricing)",
        "ขายทั้งสแต็ก/ทั้งกระเป๋าได้"
      ],
      commands: [
        { cmd: "/shop", desc: "เปิดร้านค้าหลัก", must: true },
        { cmd: "/sellall", desc: "ขายของขายได้ในกระเป๋าทั้งหมด", must: true },
        { cmd: "/sellgui", desc: "เปิดเมนูขายแบบลากของมาวาง", must: false },
        { cmd: "/esg reload", desc: "[แอดมิน] รีโหลดร้าน", must: false },
        { cmd: "/esg setprice", desc: "[แอดมิน] ตั้งราคาในเกม", must: false }
      ],
      integrations: [
        { with: "Vault", text: "ใช้เงินกลางผ่าน Vault ร่วมกับธนาคารเกาะ/EssentialsX" },
        { with: "AuraSkills", text: "ของจากสกิลฟาร์ม/ขุด เอามาขายที่นี่ = วงจรหาเงิน" }
      ]
    },
    {
      id: "vault",
      name: "Vault",
      version: "1.7.3-b131",
      cat: "economy",
      icon: "🏦",
      tagline: "ตัวกลางระบบเงิน + สิทธิ์ (เบื้องหลัง)",
      what: "ปลั๊กอินสะพานเชื่อม — ทำให้ปลั๊กเรื่องเงิน/สิทธิ์/แชต คุยกันเป็นระบบเดียว ไม่มีหน้าตาและไม่มีคำสั่งผู้เล่น แต่ปลั๊กเศรษฐกิจแทบทุกตัวต้องมี",
      features: [
        "เป็น API กลางสำหรับ 'เงิน' ให้ปลั๊กอื่นใช้ร่วมกัน",
        "เชื่อมระบบสิทธิ์เข้ากับ LuckPerms",
        "ทำงานเบื้องหลัง — ไม่มีคำสั่งสำหรับผู้เล่น"
      ],
      commands: [],
      integrations: [
        { with: "EconomyShopGUI + EssentialsX + BentoBox Bank", text: "ทุกตัวใช้ยอดเงินก้อนเดียวผ่าน Vault = เศรษฐกิจไม่แตกหลายระบบ" },
        { with: "LuckPerms", text: "Vault ดึงยศ/สิทธิ์จาก LuckPerms ให้ปลั๊กอื่นเช็กได้" }
      ]
    },
    {
      id: "decentholograms",
      name: "DecentHolograms",
      version: "2.10.0",
      cat: "display",
      icon: "💬",
      tagline: "ป้ายข้อความ/โฮโลแกรมลอยกลางอากาศ",
      what: "สร้างข้อความลอย (hologram) ได้ทุกที่ — ป้ายต้อนรับ, กระดานอันดับ, ป้ายร้าน, แสดงสถิติ รองรับ PlaceholderAPI จึงโชว์ค่าสดได้",
      features: [
        "วางข้อความลอยหลายบรรทัด + ไอคอนไอเทม",
        "อัปเดตค่าสดผ่าน PlaceholderAPI",
        "เบา ประสิทธิภาพดี",
        "ทำกระดานอันดับ (leaderboard) ได้"
      ],
      commands: [
        { cmd: "/dh", desc: "เมนูหลัก DecentHolograms", must: true },
        { cmd: "/dh create <ชื่อ> <ข้อความ>", desc: "สร้างโฮโลแกรมใหม่", must: true },
        { cmd: "/dh edit <ชื่อ>", desc: "แก้ไขโฮโลแกรม", must: false },
        { cmd: "/dh list", desc: "ดูรายการโฮโลแกรม", must: false },
        { cmd: "/dh delete <ชื่อ>", desc: "ลบโฮโลแกรม", must: false }
      ],
      integrations: [
        { with: "BentoBox Level + PlaceholderAPI", text: "ป้ายอันดับเลเวลเกาะ Top 10 อัปเดตอัตโนมัติ" },
        { with: "AuraSkills", text: "ป้ายโชว์อันดับผู้เล่นสกิลสูงสุดของเซิฟ" }
      ]
    },
    {
      id: "luckperms",
      name: "LuckPerms",
      version: "5.5.42",
      cat: "admin",
      icon: "🔑",
      tagline: "จัดการยศ + สิทธิ์/คำสั่งของผู้เล่น",
      what: "มาตรฐานวงการสำหรับจัดการ permission — สร้างยศ (สมาชิก/VIP/แอดมิน), กำหนดว่าแต่ละยศใช้คำสั่งอะไรได้, ตั้งสีชื่อ/แท็กแชต",
      features: [
        "สร้างกลุ่มยศ + ลำดับชั้น (inheritance)",
        "ให้/ถอนสิทธิ์รายคนหรือรายยศ",
        "ตั้ง prefix/suffix สีชื่อในแชต",
        "แก้ผ่านเว็บ editor ได้"
      ],
      commands: [
        { cmd: "/lp editor", desc: "เปิดลิงก์เว็บแก้สิทธิ์ (ง่ายสุด)", must: true },
        { cmd: "/lp user <ชื่อ> parent set <ยศ>", desc: "ตั้งยศให้ผู้เล่น", must: true },
        { cmd: "/lp group <ยศ> permission set <สิทธิ์> true", desc: "ให้สิทธิ์กับยศ", must: true },
        { cmd: "/lp creategroup <ยศ>", desc: "สร้างยศใหม่", must: false },
        { cmd: "/lp user <ชื่อ> info", desc: "ดูข้อมูล/สิทธิ์ผู้เล่น", must: false },
        { cmd: "/lp sync", desc: "ซิงก์ฐานข้อมูลสิทธิ์", must: false }
      ],
      integrations: [
        { with: "Vault + EssentialsX", text: "ยศจาก LuckPerms โผล่เป็น prefix สีในแชต EssentialsX อัตโนมัติ" },
        { with: "DeluxeMenus", text: "เมนูเช็กยศ (requirement) ก่อนให้กดปุ่ม เช่นเมนู VIP" }
      ]
    },
    {
      id: "essentialsx",
      name: "EssentialsX (+Chat +Spawn)",
      version: "2.22.0",
      cat: "admin",
      icon: "🧰",
      tagline: "ชุดคำสั่งพื้นฐานเซิฟ (บ้าน/วาร์ป/คิท/แชต)",
      what: "ชุดคำสั่งจำเป็นที่เกือบทุกเซิฟต้องมี — /home, /spawn, /tpa, /kit, /msg, ระบบเงินพื้นฐาน, จัดรูปแบบแชต (โมดูล Discord ถอดออกแล้ว — ค่อยลงใหม่ถ้าจะเชื่อมดิสคอร์ด)",
      features: [
        "บ้าน/วาร์ป/เทเลพอร์ต (/home /warp /tpa)",
        "คิทของแจก (/kit) + ระบบเงินพื้นฐาน",
        "Chat: จัดรูปแบบแชต + ใส่ prefix ยศ",
        "Spawn: จุดเกิดกลางของเซิฟ (/spawn /setspawn)"
      ],
      commands: [
        { cmd: "/sethome", desc: "ตั้งจุดบ้าน", must: true },
        { cmd: "/home", desc: "วาร์ปกลับบ้าน", must: true },
        { cmd: "/spawn", desc: "กลับจุดเกิดกลาง", must: true },
        { cmd: "/tpa <ชื่อ>", desc: "ขอเทเลพอร์ตไปหาผู้เล่น", must: true },
        { cmd: "/balance", desc: "เช็กเงินตัวเอง (ย่อ /bal)", must: true },
        { cmd: "/msg <ชื่อ> <ข้อความ>", desc: "กระซิบหาผู้เล่น", must: false },
        { cmd: "/pay <ชื่อ> <จำนวน>", desc: "โอนเงินให้คนอื่น", must: false },
        { cmd: "/kit [ชื่อ]", desc: "รับชุดของแจก", must: false },
        { cmd: "/back", desc: "กลับจุดตายล่าสุด", must: false },
        { cmd: "/setspawn", desc: "[แอดมิน] ตั้งจุดเกิดกลาง", must: false }
      ],
      integrations: [
        { with: "LuckPerms + Vault", text: "ดึงยศมาทำ prefix สีในแชต + ใช้เงินร่วมระบบ Vault" },
        { with: "BentoBox", text: "ตั้ง /spawn เป็นพื้นที่กลางนอกเกาะให้วาร์ปกลับมาได้" }
      ]
    },
    {
      id: "placeholderapi",
      name: "PlaceholderAPI",
      version: "2.12.2",
      cat: "util",
      icon: "🔌",
      tagline: "ตัวกลางดึงค่าจากปลั๊กอื่นมาแสดง (สำคัญมาก)",
      what: "เป็น 'กาว' ให้ปลั๊กคุยกันด้วยตัวแปร (placeholder) เช่น %vault_eco_balance% = เงินผู้เล่น เอาไปโชว์ในเมนู/โฮโลแกรม/แชต ได้ทุกที่ ปลั๊ก UI แทบทุกตัวพึ่งมัน",
      features: [
        "ดึงค่าจากปลั๊กอื่นมาเป็นตัวแปรข้อความ",
        "ติดตั้ง expansion เสริมต่อปลั๊ก",
        "ใช้ได้ใน DeluxeMenus, DecentHolograms, แชต EssentialsX"
      ],
      commands: [
        { cmd: "/papi ecloud download <ชื่อ>", desc: "โหลด expansion ของปลั๊กที่ต้องการ", must: true },
        { cmd: "/papi reload", desc: "รีโหลดหลังเพิ่ม expansion", must: true },
        { cmd: "/papi parse me <placeholder>", desc: "ทดสอบว่าตัวแปรคืนค่าอะไร", must: true },
        { cmd: "/papi list", desc: "ดู expansion ที่ลงแล้ว", must: false },
        { cmd: "/papi info <ชื่อ>", desc: "ดูข้อมูล expansion", must: false }
      ],
      integrations: [
        { with: "DeluxeMenus + DecentHolograms", text: "เป็นแกนให้สองตัวนี้โชว์เงิน/เลเวล/ยศ แบบสด" },
        { with: "AuraSkills + Vault + BentoBox", text: "ดึงเลเวลสกิล, เงิน, เลเวลเกาะ มารวมที่เดียว" }
      ]
    },
    {
      id: "multiverse",
      name: "Multiverse-Core",
      version: "5.6.1",
      cat: "world",
      icon: "🌍",
      tagline: "จัดการหลายโลกในเซิฟเดียว",
      what: "สร้าง/จัดการหลายโลก (overworld, nether, end, โลกเกม) ตั้งกฎแยกแต่ละโลก เทเลพอร์ตข้ามโลก เหมาะแยกโลกสปอว์น/มินิเกมออกจากโลกเกาะ",
      features: [
        "สร้าง/ลบ/โหลดได้หลายโลก",
        "ตั้งกฎ/สภาพอากาศ/เวลา แยกแต่ละโลก",
        "เทเลพอร์ตข้ามโลก"
      ],
      commands: [
        { cmd: "/mv list", desc: "ดูโลกทั้งหมดในเซิฟ", must: true },
        { cmd: "/mvtp <โลก>", desc: "วาร์ปไปโลกนั้น", must: true },
        { cmd: "/mv create <ชื่อ> <ชนิด>", desc: "สร้างโลกใหม่ (normal/nether/end)", must: false },
        { cmd: "/mv info <โลก>", desc: "ดูข้อมูลโลก", must: false },
        { cmd: "/mv reload", desc: "รีโหลด config", must: false }
      ],
      integrations: [
        { with: "AOneBlock", text: "แยกโลกเกาะ OneBlock ออกจากโลกสปอว์นกลาง จัดกฎคนละชุด" },
        { with: "WorldGuard", text: "ตั้งเขตป้องกันแยกตามแต่ละโลก" }
      ]
    },
    {
      id: "worldedit",
      name: "FastAsyncWorldEdit (FAWE)",
      version: "2.15.2",
      cat: "world",
      icon: "🪄",
      tagline: "แก้ไขบล็อกจำนวนมหาศาลในพริบตา (WorldEdit เวอร์ชันเร็ว)",
      what: "WorldEdit สายพันธุ์เร็ว — ทำงานแบบ async ไม่ทำเซิฟค้างตอนแก้บล็อกเยอะๆ คำสั่ง // ใช้เหมือน WorldEdit เดิมทุกอย่าง (ตัวเก่า worldedit-bukkit ถอดออกแล้วเพราะชนกัน) ใช้สร้างสปอว์น/อารีนา/ตกแต่งแมพ",
      features: [
        "เลือกพื้นที่ด้วยขวาน แล้ว set/replace/copy/paste",
        "สร้างทรง (sphere/cyl), undo/redo",
        "วาง schematic (แมพสำเร็จรูป)",
        "เร็วกว่า WorldEdit เดิมมาก — เหมาะกับงานแมพใหญ่อย่างเมือง hub"
      ],
      commands: [
        { cmd: "//wand", desc: "รับขวานไม้สำหรับเลือกพื้นที่ (ซ้าย=มุม1 ขวา=มุม2)", must: true },
        { cmd: "//set <บล็อก>", desc: "ถมบล็อกเต็มพื้นที่ที่เลือก", must: true },
        { cmd: "//copy", desc: "ก๊อปพื้นที่ที่เลือก", must: true },
        { cmd: "//paste", desc: "วางพื้นที่ที่ก๊อป", must: true },
        { cmd: "//undo", desc: "ย้อนการแก้ไขล่าสุด", must: true },
        { cmd: "//replace <เก่า> <ใหม่>", desc: "แทนบล็อกชนิดหนึ่งด้วยอีกชนิด", must: false },
        { cmd: "//sphere <บล็อก> <รัศมี>", desc: "สร้างทรงกลม", must: false }
      ],
      integrations: [
        { with: "WorldGuard", text: "เลือกพื้นที่ด้วย WorldEdit แล้วตีกรอบเขตป้องกันด้วย WorldGuard" },
        { with: "BentoBox", text: "ปั้น/ตกแต่งพื้นที่สปอว์นกลางนอกระบบเกาะ" }
      ]
    },
    {
      id: "worldguard",
      name: "WorldGuard",
      version: "7.0.16",
      cat: "world",
      icon: "🛡️",
      tagline: "ป้องกันพื้นที่ + ตั้งกฎในเขต",
      what: "กำหนดเขต (region) แล้วตั้งกฎ — ห้ามทุบ/วาง, ห้าม PvP, ห้ามมอบเกิด ฯลฯ เหมาะกันสปอว์นและพื้นที่สำคัญไม่ให้ถูกทำลาย",
      features: [
        "สร้างเขตป้องกัน + กำหนดเจ้าของ/สมาชิก",
        "ตั้ง flag: PvP, build, mob-spawning, greeting ฯลฯ",
        "กันกริฟพื้นที่สาธารณะ"
      ],
      commands: [
        { cmd: "/rg define <ชื่อ>", desc: "สร้างเขตจากพื้นที่ที่เลือกด้วย WorldEdit", must: true },
        { cmd: "/rg flag <ชื่อ> pvp deny", desc: "ตั้งกฎเขต (ตัวอย่าง: ห้าม PvP)", must: true },
        { cmd: "/rg addmember <ชื่อเขต> <ผู้เล่น>", desc: "เพิ่มสมาชิกที่แก้ในเขตได้", must: false },
        { cmd: "/rg list", desc: "ดูรายการเขตทั้งหมด", must: false },
        { cmd: "/rg info <ชื่อ>", desc: "ดูข้อมูล/กฎของเขต", must: false },
        { cmd: "/rg remove <ชื่อ>", desc: "ลบเขต", must: false }
      ],
      integrations: [
        { with: "WorldEdit", text: "ต้องใช้คู่กัน — WorldEdit เลือกพื้นที่ให้ WorldGuard ตีกรอบ" },
        { with: "Multiverse", text: "ตั้งเขตป้องกันสปอว์นแยกในแต่ละโลก" }
      ]
    },
    {
      id: "itemsadder",
      name: "ItemsAdder",
      version: "4.0.17 (beta build)",
      cat: "display",
      icon: "🎨",
      tagline: "ไอเทม/บล็อก/HUD คัสตอมผ่าน resource pack",
      what: "สร้างไอเทม บล็อก เฟอร์นิเจอร์ อีโมจิ และ HUD คัสตอมด้วย texture pack — เป็นฐานของแผน HUD สถานะตัวละครสไตล์ Ragnarok ⚠ เวอร์ชันที่ลงเป็น beta build (ผู้พัฒนาเตือนว่าอาจมีบั๊ก ควรมี backup)",
      features: [
        "ไอเทม/บล็อก/เฟอร์นิเจอร์คัสตอมพร้อม texture 3D",
        "HUD คัสตอม (หลอดเลือด/มานา/เลเวล สไตล์ RO)",
        "สร้าง resource pack ให้อัตโนมัติ ผู้เล่นโหลดตอนเข้าเซิฟ",
        "⚠ ถ้าลง MMOItems เพิ่ม ต้องปิด REAL blocks (mushroom) ใน config กันบล็อกตีกัน"
      ],
      commands: [
        { cmd: "/ia", desc: "เปิดเมนูไอเทมคัสตอมทั้งหมด", must: true },
        { cmd: "/iazip", desc: "[แอดมิน] สร้าง resource pack ใหม่หลังแก้ของ", must: true },
        { cmd: "/iaget <ชื่อ>", desc: "[แอดมิน] รับไอเทมคัสตอมเข้ากระเป๋า", must: false },
        { cmd: "/iareload", desc: "[แอดมิน] รีโหลด config", must: false }
      ],
      integrations: [
        { with: "PlaceholderAPI", text: "HUD ดึงค่าสถานะผู้เล่น (HP/เงิน/เลเวล) มาแสดงสด" },
        { with: "MythicMobs", text: "มอนสเตอร์ดรอปไอเทมคัสตอม เช่น วัตถุดิบ/การ์ดมอนตามแผนโซน" },
        { with: "ProtocolLib", text: "ใช้ ProtocolLib จัดการ packet ฝั่ง client" }
      ]
    },
    {
      id: "citizens",
      name: "Citizens",
      version: "2.0.43 (build 4210)",
      cat: "rpg",
      icon: "🧍",
      tagline: "NPC ในเมือง — เควส/ร้านค้า/ตัวละคร",
      what: "สร้าง NPC ยืนในเมือง hub — ตั้งชื่อ ใส่สกิน ให้คลิกแล้วสั่งคำสั่ง/เปิดเมนู เป็นฐานของ NPC เควสและร้านค้าตามแผนเฟส 1",
      features: [
        "สร้าง NPC รูปผู้เล่น/มอบ พร้อมสกินคัสตอม",
        "คลิก NPC แล้วสั่งคำสั่ง (เปิดร้าน/เมนู/เควส)",
        "NPC เดินตามเส้นทางที่กำหนดได้",
        "รองรับต่อยอดเป็น NPC เควสกับ BetonQuest (แผนเฟส 2)"
      ],
      commands: [
        { cmd: "/npc create <ชื่อ>", desc: "[แอดมิน] สร้าง NPC ตรงจุดที่ยืน", must: true },
        { cmd: "/npc select", desc: "[แอดมิน] เลือก NPC ที่มองอยู่", must: true },
        { cmd: "/npc skin <ชื่อผู้เล่น>", desc: "[แอดมิน] เปลี่ยนสกิน NPC", must: false },
        { cmd: "/npc command add <คำสั่ง>", desc: "[แอดมิน] ให้ NPC สั่งคำสั่งเมื่อถูกคลิก", must: false },
        { cmd: "/npc remove", desc: "[แอดมิน] ลบ NPC ที่เลือก", must: false }
      ],
      integrations: [
        { with: "DeluxeMenus", text: "คลิก NPC เปิดเมนู GUI เช่น NPC พ่อค้าเปิดร้าน EconomyShopGUI" },
        { with: "แผนโซนมิดกาเรีย", text: "NPC แจกเควสแรก 'ล่าพูริ 10 ตัว' หน้าประตูเมือง" }
      ]
    },
    {
      id: "tab",
      name: "TAB",
      version: "6.1.0",
      cat: "display",
      icon: "📑",
      tagline: "จัด tablist / scoreboard / ชื่อหัวผู้เล่น",
      what: "ปรับหน้า Tab list, scoreboard ข้างจอ, และป้ายชื่อเหนือหัวผู้เล่น — ใส่ยศ สี และค่าจาก PlaceholderAPI ได้ ทำให้เซิฟดูเป็นมืออาชีพ",
      features: [
        "จัด tablist เอง (header/footer/เรียงตามยศ)",
        "scoreboard ข้างจอโชว์เงิน/เลเวล/ข้อมูลเซิฟ",
        "ป้ายชื่อเหนือหัว + prefix ยศจาก LuckPerms",
        "รองรับ PlaceholderAPI ทุกจุด"
      ],
      commands: [
        { cmd: "/tab reload", desc: "[แอดมิน] รีโหลด config", must: true },
        { cmd: "/tab parse <ผู้เล่น> <placeholder>", desc: "[แอดมิน] ทดสอบ placeholder", must: false }
      ],
      integrations: [
        { with: "LuckPerms + PlaceholderAPI", text: "tablist เรียงตามยศ + โชว์เงิน/เลเวลสกิลสด" },
        { with: "AuraSkills + BentoBox", text: "scoreboard โชว์เลเวลสกิลกับเลเวลเกาะไว้ข้างจอ" }
      ]
    },
    {
      id: "protocollib",
      name: "ProtocolLib",
      version: "5.5.0-SNAPSHOT",
      cat: "util",
      icon: "📡",
      tagline: "ไลบรารี packet ให้ปลั๊กอื่นใช้ (เบื้องหลัง)",
      what: "ปลั๊กอินไลบรารี — เปิดทางให้ปลั๊กอื่นแก้ packet ที่ส่งระหว่างเซิฟกับ client ไม่มีคำสั่งผู้เล่น ลงไว้เพราะ ItemsAdder ต้องใช้",
      features: [
        "เป็น API กลางเรื่อง packet ให้ปลั๊กอื่น",
        "ทำงานเบื้องหลัง — ไม่มีคำสั่งสำหรับผู้เล่น"
      ],
      commands: [],
      integrations: [
        { with: "ItemsAdder", text: "ใช้จัดการ packet ของไอเทม/HUD คัสตอม" }
      ]
    },
    {
      id: "spark",
      name: "spark",
      version: "มากับ Paper (bundled)",
      cat: "util",
      icon: "📊",
      tagline: "เครื่องมือวัดประสิทธิภาพ/หาสาเหตุแลค",
      what: "เครื่องมือ profiler ที่มากับ Paper — วัด TPS, CPU/RAM, หาว่าอะไรทำให้เซิฟแลค รายงานเป็นลิงก์เว็บ ใช้ตอนเซิฟกระตุก",
      features: [
        "ดู TPS / MSPT / การใช้ RAM สด",
        "profiler หาตัวการแลค",
        "รายงานออกมาเป็นลิงก์เว็บ"
      ],
      commands: [
        { cmd: "/spark tps", desc: "ดู TPS ปัจจุบัน (ควรใกล้ 20)", must: true },
        { cmd: "/spark profiler", desc: "เริ่มเก็บข้อมูลหาตัวการแลค", must: true },
        { cmd: "/spark health", desc: "ดูสุขภาพเซิฟ (RAM/GC)", must: false },
        { cmd: "/spark gc", desc: "ดูสถิติ garbage collection", must: false }
      ],
      integrations: [
        { with: "ทุกปลั๊กอิน", text: "ตรวจว่าปลั๊กตัวไหนกินทรัพยากร เช่นถ้าลง ItemsAdder แล้วหนักจะเห็นทันที" }
      ]
    }
  ],

  /* ---------- ปลั๊กอินที่ยังขาด (ตามแผนเฟสใน CLAUDE.md) ---------- */
  planned: [
    {
      name: "CoreProtect",
      phase: 1,
      icon: "🕵️",
      why: "log ทุกการทุบ/วาง/เปิดกล่อง + rollback ได้ — ของสำคัญที่สุดที่ยังขาด ต้องมีก่อนเปิดให้เพื่อนเข้า ไม่งั้นโดนกริฟแล้วกู้ไม่ได้ (เช็กแล้ว: v24.0 รองรับ 1.21.11 ✓ ไม่มี dependency โหลดจาก Modrinth)",
      status: "พร้อมติดตั้งเลย (ฟรี)",
      pairs: "ใช้คู่กับ WorldGuard: WorldGuard กันพื้นที่ / CoreProtect กู้ความเสียหายที่หลุดมา"
    },
    {
      name: "MMOItems + MythicLib",
      phase: 1,
      icon: "⚔️",
      why: "หัวใจไอเทม RPG — อาวุธ/เกราะมี stat, tier, ตีบวก ตามแผนโซนมิดกาเรีย (MythicLib ฟรี / MMOItems €19.99 บน SpigotMC — หน้าร้าน tested ถึง 1.21 ควรถาม Discord ของ PhoenixDevt ว่ารองรับ 1.21.11 หรือยัง ก่อนจ่ายเงิน)",
      status: "รอซื้อ (€19.99) — เช็กเวอร์ชันก่อน",
      pairs: "⚠ ลงแล้วต้องปิด REAL blocks ใน config ItemsAdder กันบล็อกตีกัน (มีวิธีในวิกิ IA) / เกราะ skin ของ MMOItems ใช้กับเกราะ IA ไม่ได้ / เชื่อม MythicMobs ให้มอนดรอปไอเทม MMOItems"
    },
    {
      name: "ระบบ backup อัตโนมัติ",
      phase: 1,
      icon: "💾",
      why: "ตอนนี้มีแค่ git (เก็บ config ไม่เก็บโลก) — ต้องมี backup โลกอัตโนมัติก่อนเปิดจริง จะใช้ plugin หรือ task scheduler ของ Windows ก็ได้",
      status: "รอเลือกวิธี",
      pairs: "ทำงานร่วมกับ CoreProtect: backup กู้ทั้งโลก / CoreProtect กู้เฉพาะจุด"
    },
    {
      name: "MMOCore",
      phase: 2,
      icon: "🧙",
      why: "ระบบอาชีพ/คลาส (รวม Gunslinger ตามแผน) + เลเวลผู้เล่น ค่ายเดียวกับ MMOItems ทำงานเข้ากันดี (€19.99 — เช็กความเข้ากับ 1.21.11 พร้อม MMOItems ทีเดียว)",
      status: "รอเฟส 2 (€19.99)",
      pairs: "MMOItems กำหนด requirement อาชีพ/เลเวลบนไอเทมได้"
    },
    {
      name: "BetonQuest",
      phase: 2,
      icon: "📜",
      why: "ระบบเควสหลัก+รายวัน — เควสแรก 'ล่าพูริ 10 ตัว' ของโซนมิดกาเรียรอปลั๊กนี้ (เช็กแล้ว: v3.0.2 รองรับ 1.21.11 ✓ — เริ่มเขียนเควสที่ 3.x เลย เพราะ syntax เปลี่ยนจาก 2.x เยอะ)",
      status: "รอเฟส 2 (ฟรี, รองรับแล้ว)",
      pairs: "Citizens เป็นตัว NPC ให้กด / MythicMobs นับยอดฆ่ามอนคัสตอมได้"
    },
    {
      name: "ModelEngine",
      phase: 2,
      icon: "🦖",
      why: "โมเดลมอน 3D ซับซ้อน (บอสลูนาเรกซ์ กระต่ายยักษ์) — MythicMobs เรียกใช้โมเดลได้ตรง (เช็กแล้ว: R4.0.9 รองรับ 1.19.4–1.21.11 ✓ ราคา $39.99 บน MythicCraft)",
      status: "รอเฟส 2 ($39.99)",
      pairs: "MythicMobs + ModelEngine = บอสมีท่าทาง/animation จริง"
    },
    {
      name: "Anti-cheat (GrimAC แนะนำ)",
      phase: 2,
      icon: "🚫",
      why: "กันโกงก่อนเปิดกว้าง — researcher แนะนำ GrimAC: ฟรี open source รองรับ 1.21.11 เป็นทางการ (v2.3.73) ไม่ต้องพึ่ง ProtocolLib / Vulcan ($19.99) เก็บไว้เป็นตัวเสริมด้าน combat ถ้า GrimAC ไม่พอ",
      status: "รอเฟส 2 (GrimAC ฟรี)",
      pairs: "⚠ สกิล MythicMobs ที่ดัน/วาร์ปผู้เล่นอาจโดนจับผิด (false positive) — ต้องตั้ง exemption ใน config"
    },
    {
      name: "Parties / Guilds",
      phase: 2,
      icon: "🤝",
      why: "ตีบอสเป็นปาร์ตี้ + ระบบกิลด์",
      status: "รอเฟส 2",
      pairs: "แชร์ XP AuraSkills ในปาร์ตี้ / ตีบอสโซนด้วยกัน"
    },
    {
      name: "Crates + AuctionHouse + Tebex + VotingPlugin",
      phase: 3,
      icon: "🎁",
      why: "ชุด retention + monetization: กล่องสุ่ม, ตลาดประมูล, ร้านเติมเงิน, โหวตรับรางวัล",
      status: "รอเฟส 3",
      pairs: "รางวัลทั้งหมดวิ่งผ่าน Vault + ItemsAdder cosmetic ไม่ขายพลัง (ตามหลัก ไม่ pay-to-win)"
    }
  ],

  /* ---------- ตัวอย่างวงจรการเชื่อมปลั๊กอิน (เห็นภาพจริง) ---------- */
  flows: [
    {
      title: "วงจรเงินหลักของเซิฟ",
      icon: "💰",
      steps: [
        { plug: "MythicMobs", text: "มอนโซนมิดกาเรียดรอปเงิน + วัตถุดิบ (เจลลี่เหนียว, ขนกระต่าย)" },
        { plug: "Vault", text: "เงินเข้ากระเป๋ากลาง — ทุกปลั๊กเห็นยอดเดียวกัน" },
        { plug: "EconomyShopGUI", text: "ผู้เล่นกด /sellall ขายวัตถุดิบ → ได้เงินเพิ่ม" },
        { plug: "BentoBox Bank", text: "เก็บเงินเข้าธนาคารเกาะ หรือเอาไปซื้อของต่อ" }
      ],
      note: "เงินก้อนเดียวไหลทั้งระบบ — นี่คือเหตุผลที่ Vault สำคัญแม้ไม่มีคำสั่งอะไรเลย"
    },
    {
      title: "เควสแรกของผู้เล่นใหม่ (แผนโซนมิดกาเรีย)",
      icon: "🗺️",
      steps: [
        { plug: "Citizens", text: "NPC หน้าประตูเมือง — คลิกเพื่อคุย" },
        { plug: "DeluxeMenus", text: "เปิดเมนูเควส 'ล่าพูริ 10 ตัว' (เฟสแรกใช้เมนูไปก่อน รอ BetonQuest)" },
        { plug: "MythicMobs", text: "พูริ (เจลลี่ชมพู) ตายแล้วดรอปเจลลี่เหนียว 60%" },
        { plug: "ItemsAdder", text: "เจลลี่เหนียว = ไอเทมคัสตอมมี texture เอง" },
        { plug: "TAB", text: "scoreboard ข้างจอโชว์ยอดเงิน/เลเวลที่เพิ่มขึ้น" }
      ],
      note: "ผู้เล่นเห็น 'ตัวเลขดีขึ้น' ครบวงจรใน 10 นาทีแรก ตามหลักออกแบบโซน"
    },
    {
      title: "ป้ายอันดับเกาะที่สปอว์น",
      icon: "🏆",
      steps: [
        { plug: "BentoBox Level", text: "คำนวณเลเวลเกาะจากบล็อกที่วาง" },
        { plug: "PlaceholderAPI", text: "แปลงเป็นตัวแปร %level_top% ให้ปลั๊กอื่นดึง" },
        { plug: "DecentHolograms", text: "ป้ายลอย Top 10 เกาะ อัปเดตเองที่สปอว์น" }
      ],
      note: "สามตัวนี้ไม่รู้จักกันเลย แต่คุยกันผ่าน PlaceholderAPI ตรงกลาง"
    },
    {
      title: "HUD สถานะสไตล์ Ragnarok (แผนเฟส 2)",
      icon: "🎮",
      steps: [
        { plug: "AuraSkills", text: "เก็บค่า HP / มานา / เลเวลสกิลผู้เล่น" },
        { plug: "PlaceholderAPI", text: "ส่งค่าเป็นตัวแปรสด" },
        { plug: "ItemsAdder", text: "วาด HUD หลอดเลือด/มานาแบบ RO ทับหน้าจอผ่าน resource pack" }
      ],
      note: "นี่คือเหตุผลที่ลง ItemsAdder ไว้ — เป็นฐานของ UI เอกลักษณ์เซิฟ"
    }
  ]
};
