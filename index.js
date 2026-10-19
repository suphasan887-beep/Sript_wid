const express = require('express');
const express = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// อนุญาตการเข้าถึง
app.use(cors());
app.use(express.json());

// 🔗 ลิงก์ Raw สคริปต์หลักของคุณบน GitHub
const MAIN_SCRIPT_URL = "https://raw.githubusercontent.com/eroomaji-gif/scripbass64/refs/heads/main/KTOMAp";

// ==========================================
// 📍 API 1: สำหรับหน้าเว็บ (กดรับสคริปต์/รหัสสุ่ม)
// ==========================================
app.get('/generate-token-and-script', (req, res) => {
    // 1. สุ่มสร้างรหัส/Token ใหม่ที่ไม่ซ้ำกันตลอดเวลาโดยไม่มีการเช็คเงื่อนไขใดๆ
    const newToken = "CODE_" + Math.random().toString(36).substring(2, 10).toUpperCase() + "_" + Date.now().toString(36).toUpperCase();
    
    // 2. ดึง URL ของ Render เอง
    const host = req.get('host');
    const protocol = req.protocol;
    const backendUrl = `${protocol}://${host}`;

    // 3. ประกอบเป็น Loadstring บรรทัดเดียวที่มีรหัสสุ่มติดไป
    const loaderScript = `loadstring(game:HttpGet("${backendUrl}/verify-and-load?token=${newToken}"))()`;

    // 4. ส่งค่ากลับไปหาหน้าเว็บทันที
    return res.json({
        success: true,
        token: newToken,
        loaderScript: loaderScript
    });
});

// ==========================================
// 📍 API 2: สำหรับรันในเกม (ดึงสคริปต์หลักทันที ไม่มีการเช็ควันหมดอายุหรือ HWID)
// ==========================================
app.get('/verify-and-load', async (req, res) => {
    try {
        // ดึงสคริปต์หลักจาก GitHub มาพ่นให้รันในเกมได้ทันทีแบบอิสระ
        const scriptResponse = await fetch(MAIN_SCRIPT_URL);
        
        if (!scriptResponse.ok) {
            return res.send("warn('⚠️ ไม่สามารถดึงสคริปต์หลักจาก GitHub ได้')");
        }

        const mainScriptCode = await scriptResponse.text();
        
        // ส่งเนื้อหาสคริปต์กลับไปทำงาน
        res.setHeader('Content-Type', 'text/plain');
        return res.send(mainScriptCode);

    } catch (error) {
        console.error("Error fetching main script:", error);
        return res.send("warn('⚠️ เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ในการดึงสคริปต์')");
    }
});

// หน้าแรกเช็คสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send("🚀 Backend Server (No Restrictions) is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
        
