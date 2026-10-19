const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// อนุญาตให้หน้าเว็บ HTML บน GitHub Pages ของคุณยิงเข้ามาขอโค้ดได้ (CORS Enabled)
app.use(cors());
app.use(express.json());

// 🔗 ลิงก์ Raw สคริปต์หลักของคุณบน GitHub (แนะนำเป็น Private หรือ Public Raw Link)
// ⚠️ อย่าลืมเปลี่ยนเป็น URL สคริปต์หลักตัวจริงของคุณ
const MAIN_SCRIPT_URL = "https://raw.githubusercontent.com/eroomaji-gif/scripbass64/refs/heads/main/KTOMAp";

// 🗄️ ฐานข้อมูลสำหรับเก็บ Token (ในหน่วยความจำ RAM)
// ในอนาคตสามารถเปลี่ยนเชื่อมต่อไปใช้ Supabase หรือ MongoDB ได้สะดวกครับ
const tokenStore = {};

// ==========================================
// 📍 API 1: สำหรับหน้าเว็บ HTML ของคุณ (เมื่อกดปุ่ม Get Script)
// ==========================================
app.get('/generate-token-and-script', (req, res) => {
        // 🔒 ระบบเช็คว่ามาจากเว็บของเราจริงไหม
    const origin = req.get('origin');
    const referer = req.get('referer');
    const allowedWebsite = "https://suphasan887-beep.github.io"; 

    const isAllowed = (origin && origin.startsWith(allowedWebsite)) || 
                      (referer && referer.startsWith(allowedWebsite));

    if (!isAllowed) {
        return res.status(403).json({ 
            success: false, 
            message: "Access Denied: อนุญาตให้ใช้งานผ่านหน้าเว็บหลักเท่านั้น!" 
        });
    }
    
    // 1. สุ่มสร้าง Token ใหม่ที่ไม่ซ้ำกัน
    const newToken = "TOKEN_" + Math.random().toString(36).substring(2, 10).toUpperCase() + "_" + Date.now().toString(36).toUpperCase();
    
    // 2. ตั้งค่าวันหมดอายุ 7 วัน (7 วัน * 24 ชม. * 60 นาที * 60 วินาที * 1000 มิลลิวินาที)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    // 3. บันทึกลงระบบ
    tokenStore[newToken] = {
        createdAt: Date.now(),
        expiresAt: Date.now() + SEVEN_DAYS_MS,
        hwid: null // จะผูก HWID ตอนรันใน Roblox ครั้งแรก
    };

    // 4. ดึง URL ของ Render เอง (หรือระบุแบบ Manual)
    const host = req.get('host');
    const protocol = req.protocol;
    const backendUrl = `${protocol}://${host}`;

    // 5. ประกอบเป็น Loadstring บรรทัดเดียวที่มี Token
    const loaderScript = `loadstring(game:HttpGet("${backendUrl}/verify-and-load?token=${newToken}"))()`;

    // 6. พ่นตอบกลับไปหาหน้าเว็บ HTML
    return res.json({
        success: true,
        token: newToken,
        expiresInDays: 7,
        loaderScript: loaderScript
    });
});

// ==========================================
// 📍 API 2: สำหรับ Roblox Executor (เมื่อนำ Loadstring ไปรันในเกม)
// ==========================================
app.get('/verify-and-load', async (req, res) => {
    const { token, hwid } = req.query;

    // เช็คว่าส่งข้อมูลมาครบไหม
    if (!token) {
        return res.status(400).send("print('❌ [Security Error] Missing Token')");
    }

    const tokenData = tokenStore[token];

    // 1. เช็คว่ามี Token นี้ในระบบไหม
    if (!tokenData) {
        return res.send("game.Players.LocalPlayer:Kick('❌ Token ไม่ถูกต้อง หรือไม่พบในระบบ!')");
    }

    // 2. เช็ควันหมดอายุ (7 วัน)
    if (Date.now() > tokenData.expiresAt) {
        return res.send("game.Players.LocalPlayer:Kick('❌ สคริปต์นี้หมดอายุ 7 วันแล้ว! กรุณากลับไปกดรับ Token ใหม่ที่หน้าเว็บ')");
    }

    // 3. ตรวจสอบการผูกเครื่อง (HWID Binding)
        // 3. ตรวจสอบการผูกเครื่อง (HWID Binding)
    if (hwid) {
        if (!tokenData.hwid) {
            // ถ้ายังไม่มีการผูก HWID ให้บันทึก HWID เครื่องนี้ไว้ทันที (รันครั้งแรก)
            tokenData.hwid = hwid;
            console.log(`[HWID Bound] Token ${token} bound to HWID: ${hwid}`);
        } else if (tokenData.hwid !== hwid) {
            // ถ้ามี HWID อยู่แล้ว แต่ค่าไม่ตรงกับเครื่องเดิม -> ดีดออกจากเกมทันที
            return res.send("game.Players.LocalPlayer:Kick('❌ [Anti-Leak] Token นี้ถูกใช้งานกับเครื่องอื่นแล้ว!')");
        }
        // ถ้า HWID ตรงกัน จะปล่อยให้ผ่านไปรันโค้ดด้านล่างได้ปกติ (รันซ้ำกี่รอบก็ได้ในเครื่องเดิม)
                    }
        
    // 4. ผ่านเงื่อนไขทั้งหมด -> ไปดึงสคริปต์หลักจาก GitHub มาพ่นให้ Roblox execute
    try {
        const scriptResponse = await fetch(MAIN_SCRIPT_URL);
        
        if (!scriptResponse.ok) {
            return res.send("warn('⚠️ ไม่สามารถดึงสคริปต์หลักจาก GitHub ได้')");
        }

        const mainScriptCode = await scriptResponse.text();
        
        // พ่นเนื้อหาสคริปต์หลักกลับไปให้ Roblox
        res.setHeader('Content-Type', 'text/plain');
        return res.send(mainScriptCode);

    } catch (error) {
        console.error("Error fetching main script:", error);
        return res.send("warn('⚠️ เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ในการดึงสคริปต์')");
    }
});

// หน้าแรกเช็คสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send("🚀 Backend Server & HWID Verification System is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
      
