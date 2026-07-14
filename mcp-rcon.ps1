# ตัวกลางเปิด MCP "minecraft-rcon" — อ่านรหัส RCON จาก server.properties ตอนรัน
# รหัสผ่านจึงไม่ถูกเก็บไว้ใน config ของ Claude Code (อยู่ที่เดียวคือ server.properties)
$serverDir = "C:\Users\Taro\OneDrive\เดสก์ท็อป\server new"
$props = Get-Content (Join-Path $serverDir "server.properties")

$env:RCON_HOST = "localhost"
$env:RCON_PORT = "25575"
$env:RCON_PASSWORD = (($props | Where-Object { $_ -match '^rcon\.password=' }) -replace '^rcon\.password=', '').Trim()
$env:SERVER_DIR = $serverDir

uvx --from git+https://github.com/MinecraftCodeFoundary/Minecraft-MCP-Server minecraft-rcon-mcp
