const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ฟังก์ชันสำหรับสุ่มตัวเลขไม่ซ้ำกันตามจำนวนที่ต้องการ
function generateUniqueRandomNumbers(count, min, max) {
    if (max - min + 1 < count) {
        throw new Error("ช่วงของตัวเลขน้อยกว่าจำนวนที่ต้องการสุ่ม");
    }
    const numbers = [];
    while (numbers.length < count) {
        const r = Math.floor(Math.random() * (max - min + 1)) + min;
        if (numbers.indexOf(r) === -1) {
            numbers.push(r);
        }
    }
    return numbers;
}

// Endpoint สำหรับส่งสคริปต์และตัวเลขสุ่ม
app.get('/render', (req, res) => {
    // สุ่มตัวเลขไม่ซ้ำกัน 5 ตัว (ในช่วง 1 ถึง 1000)
    const uniqueRandoms = generateUniqueRandomNumbers(5, 1, 1000);

    // โครงสร้างสคริปต์ตัวเต็มที่ส่งกลับไปแบบไม่มีการตรวจสอบใดๆ ทั้งสิ้น
    const scriptResponse = {
        status: "success",
        message: "Script loaded successfully (No verification required)",
        random_data: uniqueRandoms,
        script_content: {
            target: "HEAD",
            features: [
                "aimbot_enabled",
                "headshot_optimized",
                "screen_config_v1.62"
            ],
            execution_time: new Date().toISOString()
        }
    };

    res.status(200).json(scriptResponse);
});

app.listen(port, () => {
    console.log(`Server is running smoothly on port ${port}`);
});
