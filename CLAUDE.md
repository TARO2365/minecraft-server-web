# CLAUDE.md — แผนเซิร์ฟเวอร์ Minecraft: MMORPG Hub + OneBlock

> ไฟล์นี้คือ design document หลักของโปรเจกต์ Claude Code ต้องอ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง

---

## กฎการทำงานร่วมกับ AI (สำคัญที่สุด — อ่านก่อน)

1. **ห้ามแก้ไฟล์ใดๆ โดยไม่ได้รับอนุมัติจากเจ้าของเซิร์ฟก่อน** — เสนอ diff/แผนการแก้ให้ดูก่อนเสมอ
2. AI ทำหน้าที่เป็น **ที่ปรึกษาและผู้ช่วยเขียน config** ไม่ใช่ผู้ดำเนินการอัตโนมัติ
3. อ่าน/วิเคราะห์ไฟล์ได้อิสระ (read-only) แต่การเขียน/ลบ/ย้ายไฟล์ต้องขอทีละครั้ง
4. ห้ามรันคำสั่งที่กระทบเซิร์ฟที่กำลังรัน (restart, delete world, ฯลฯ) โดยไม่ถาม
5. อธิบายเหตุผลของทุกการเปลี่ยนแปลง — เจ้าของต้องการเข้าใจ ไม่ใช่แค่ก็อปคำสั่ง
6. ตอบเป็นภาษาไทย ใช้ภาษาง่ายๆ

---

## แนวคิดหลักของเซิร์ฟ

**"MMORPG Hub + OneBlock เป็นบ้านส่วนตัว"**

- **Spawn = เมืองหลักสไตล์ MMORPG** — เดินออกจากเมืองเจอโซนล่ามอนสเตอร์ แบ่งตามเลเวล
- **แต่ละโซนมีมอนไม่เหมือนกัน** ตามเลเวลที่ต่างกันไป มีบอสประจำโซน และบอสโลก (world boss)
- **OneBlock = เกาะส่วนตัวของผู้เล่นแต่ละคน** ใช้สร้างบ้าน ฟาร์ม เป็นพื้นที่ปลอดภัย
- **เป้าหมาย:** เซิร์ฟที่สนุก ผู้เล่นไม่ตัน มีของให้ทำต่อเนื่อง และมีช่องทางเติมเงินที่ไม่ pay-to-win จนเสียสมดุล
- **UI เอกลักษณ์:** หน้าสถานะตัวละครสไตล์ Ragnarok Online (HUD custom ผ่าน ItemsAdder + PlaceholderAPI)
- **Map hub:** เกาะลอยฟ้าธีมซากุระ (สร้างด้วย Axiom ใน singleplayer แล้ว export เข้าเซิร์ฟ)

---

## Tech Stack

| ส่วน | ของที่ใช้ |
|---|---|
| Server core | Paper (ตัวล่าสุด) + Java 21 |
| พื้นฐาน | LuckPerms, Vault, PlaceholderAPI |
| OneBlock | BentoBox (+ addon: Level) |
| ไอเทม RPG | MMOItems |
| อาชีพ/คลาส | MMOCore (แผน — ค่ายเดียวกับ MMOItems) |
| มอน/บอส | MythicMobs |
| Custom texture/model/HUD | ItemsAdder (+ ModelEngine สำหรับ model ซับซ้อน) |
| เควส | BetonQuest (แผน) |
| เศรษฐกิจ/ร้านค้า | ยังไม่เลือก (ตัวเลือก: EconomyShopGUI, zShop) |
| คำสั่งพื้นฐาน | EssentialsX (/spawn, /home, /tpa, kit) |
| ความปลอดภัย | CoreProtect (log/rollback), WorldGuard + WorldEdit (กันโซน), anti-cheat (Vulcan หรือ GrimAC), AuthMe (ถ้า offline-mode), backup อัตโนมัติ |
| NPC | Citizens (NPC เควส/ร้านค้าในเมือง) |
| Party/Guild | Parties หรือ Guilds (แผนเฟส 2) |
| กล่องสุ่ม | ExcellentCrates หรือ CrazyCrates (แผนเฟส 3) |
| ประมูล | AuctionHouse หรือ zAuctionHouse (แผนเฟส 3) |
| ร้านเติมเงิน | Tebex หรือระบบ topup ไทย (แผนเฟส 3) |
| โหวตเซิร์ฟ | NuVotifier + VotingPlugin (แผนเฟส 3) |
| Tablist/Scoreboard | TAB |
| Hologram | DecentHolograms (แผน) |

**สภาพแวดล้อม:** พัฒนาบนคอมส่วนตัว (Windows) เทสในเครื่องก่อน ยังไม่ขึ้น hosting

---

## แผนพัฒนาแบ่งเฟส

### เฟส 1 — แกนเกมขั้นต่ำ (เป้า: สนุกใน 30 นาทีแรก)
- [ ] ตั้งเซิร์ฟ Paper + plugin พื้นฐาน (LuckPerms, Vault, PlaceholderAPI)
- [ ] Spawn ชั่วคราว (map จริงรอ Axiom)
- [ ] โซนมอน 2-3 โซนแรก แบ่งตามเลเวล (MythicMobs)
- [ ] อาวุธ/ชุดเกราะพื้นฐานต่อโซน (MMOItems)
- [ ] ระบบเงิน + มอนดรอปเงิน/วัตถุดิบ
- [ ] ความปลอดภัย: CoreProtect + WorldGuard (กันโซน spawn) + backup อัตโนมัติ
- [ ] EssentialsX (คำสั่งพื้นฐาน) + TAB (tablist/scoreboard)
- [ ] Citizens — NPC ตัวแรกๆ ในเมือง
- [ ] เปิดให้เพื่อนทดสอบ

### เฟส 2 — ความลึกของเกม
- [ ] ระบบเควส (BetonQuest) — เควสหลักต่อโซน + เควสรายวัน
- [ ] บอสประจำโซน + world boss
- [ ] ระบบตีบวก/อัปเกรดไอเทม (MMOItems upgrade — กำหนดโอกาสสำเร็จ/แตก)
- [ ] ระบบอาชีพ 2-3 อาชีพแรก รวม **Gunslinger** (ระบบปืนผ่าน MMOItems gun type + MMOCore)
- [ ] HUD สถานะตัวละครสไตล์ Ragnarok
- [ ] Party/Guild — ตีบอสเป็นปาร์ตี้ (Parties/Guilds)
- [ ] Anti-cheat (Vulcan หรือ GrimAC) — ก่อนเปิดกว้างขึ้น

### เฟส 3 — OneBlock + Retention + Monetization
- [ ] ผูก OneBlock เข้ากับเศรษฐกิจหลัก (ของจากเกาะขายในเมืองได้)
- [ ] Island level → ปลดล็อคสิทธิ์ (ขนาดเกาะ, สมาชิก, warp)
- [ ] ระบบมินเนี่ยน (ตัวช่วยฟาร์มบนเกาะ: ขุด/ปลูก/เก็บของ — ต้องออกแบบความสามารถเพิ่ม)
- [ ] คอสเมติก + ยานพาหนะ (ItemsAdder + ModelEngine)
- [ ] ยศ/rank หลากหลาย (progression rank + donor rank)
- [ ] กล่องสุ่ม (Crates) + ประมูล (Auction House)
- [ ] ร้านเติมเงินผูกเว็บ (Tebex / topup ไทย)
- [ ] โหวตเซิร์ฟรับรางวัล (NuVotifier + VotingPlugin)
- [ ] Leaderboard + hologram

### เฟส 4 — โปรเจกต์ขั้นสูง
- [ ] Web panel จัดการเซิร์ฟ: แก้/เพิ่มไอเทม ใส่ texture ปรับค่า stat พร้อมพรีวิว (โปรเจกต์ software แยก)
- [ ] ระบบปลูกผัก custom ที่ไม่ใช่ plugin สำเร็จรูป — มี gameplay จริง เช่น ผักผูกกับโซน/ฤดู, ผักหายากปลูกได้เฉพาะพื้นที่พิเศษ, mini-game ตอนเก็บเกี่ยว (อาจต้องเขียน plugin เอง)
- [ ] Import map hub เกาะลอยฟ้าซากุระจาก Axiom

---

## หลักการออกแบบ

- **ทำทีละระบบ ให้เข้ากันก่อนค่อยเพิ่ม** — บทเรียนเดิม: ลงของเยอะพร้อมกัน = config ชนกัน + balance พัง
- **ทุกระบบต้องตอบคำถาม "ทำไมผู้เล่นถึงอยากทำสิ่งนี้ซ้ำ"** ก่อนลงมือ
- Monetization เน้นคอสเมติก/ความสะดวก ไม่ขายพลังตรงๆ
- เนื้อหา endgame ค่อยคิดหลังเฟส 2 (แนวโน้ม: prestige/rebirth)

---

## สถานะปัจจุบัน

- อยู่ช่วงเริ่มเฟส 1: กำลังตั้งเซิร์ฟบนคอมส่วนตัว
- Map hub ยังไม่เริ่มสร้าง (รอทำใน Axiom singleplayer)
- ยังไม่ได้ตัดสินใจ: economy plugin, รายละเอียดโซนแรก (ชื่อ/ธีม/มอน), สูตรตีบวก

## สิ่งที่ต้องตัดสินใจถัดไป

1. ออกแบบโซนแรก: ชื่อ ธีม เลเวลมอน 3-4 ตัว ตารางดรอป
2. โครงเลเวลผู้เล่น (cap เท่าไหร่ / เลเวลต่อโซน)
3. เลือก economy shop plugin
