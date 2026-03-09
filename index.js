const express = require('express');
const { createCanvas } = require('canvas');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle text from LSL
app.use(express.text());

// --- DATABASE PERSISTENCE ---
let accounts = {};
const DB_FILE = './database.json';

// Load data if it exists, otherwise start fresh
if (fs.existsSync(DB_FILE)) {
    try {
        accounts = JSON.parse(fs.readFileSync(DB_FILE));
        console.log("✅ Database Loaded Successfully.");
    } catch (err) {
        console.log("⚠️ Database Corrupt. Starting fresh.");
        accounts = {};
    }
}

const saveDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(accounts, null, 2));
};

// --- ROUTES ---

// 1. Homepage (Fixes the "Cannot GET /" error)
app.get('/', (req, res) => {
    res.send(`
        <body style="background: #1a1a2e; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🏦 EMARI MEGA BANK</h1>
            <p>Status: <span style="color: #00ff00;">ONLINE</span></p>
            <p>Total Registered Accounts: ${Object.keys(accounts).length}</p>
            <hr style="width: 50%; border: 0.5px solid #444;">
            <small>Phase C Architecture Active</small>
        </body>
    `);
});

// 2. The Banking API (For the ATM)
app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    if (!accounts[user]) {
        accounts[user] = { checking: 0, savings: 0, pin: "NONE", kin: "NONE", hasCard: 0, isKid: 0, logs: [] };
    }
    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT":
            res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}|${acc.hasCard}|${acc.isKid}`);
            break;

        case "DEPOSIT":
            acc.checking += parseInt(value);
            acc.logs.push(`[${new Date().toLocaleDateString()}] +L$${value} (Deposit)`);
            saveDB(); res.send("SUCCESS"); break;

        case "WITHDRAW":
            let wAmt = parseInt(value);
            if (acc.isKid && wAmt > 50) return res.send("KID_LIMIT");
            if (acc.checking >= wAmt) {
                acc.checking -= wAmt;
                acc.logs.push(`[${new Date().toLocaleDateString()}] -L$${wAmt} (Withdrawal)`);
                saveDB(); res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "TO_SAVINGS":
            let sAmt = parseInt(value);
            if (acc.checking >= sAmt) {
                acc.checking -= sAmt; acc.savings += sAmt;
                acc.logs.push(`Moved L$${sAmt} to Savings`);
                saveDB(); res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "FROM_SAVINGS":
            let fAmt = parseInt(value);
            if (acc.savings >= fAmt) {
                acc.savings -= fAmt; acc.checking += fAmt;
                acc.logs.push(`Moved L$${fAmt} to Current`);
                saveDB(); res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "SET_PIN": acc.pin = value; saveDB(); res.send("SUCCESS"); break;
        case "SET_KIN": acc.kin = value; saveDB(); res.send("SUCCESS"); break;
        case "SET_KID": acc.isKid = parseInt(value); saveDB(); res.send("SUCCESS"); break;
        case "ISSUE_CARD": acc.hasCard = 1; saveDB(); res.send("CARD_ISSUED"); break;
        case "GET_LOGS": res.send(acc.logs.slice(-5).join("\n") || "No transactions."); break;

        case "CLAIM_KIN":
            let target = accounts[value];
            if (target && target.kin === user) {
                let total = target.checking + target.savings;
                acc.checking += total;
                target.checking = 0; target.savings = 0;
                acc.logs.push(`Inherited L$${total} from ${value}`);
                saveDB(); res.send("CLAIMED|" + total);
            } else res.send("DENIED");
            break;
    }
});

// 3. Dynamic Card Image Generator (For the Physical Mesh Card)
app.get('/card/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const acc = accounts[uuid] || { checking: 0 };
    
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext('2d');

    // Background Styling
    ctx.fillStyle = '#12122b'; ctx.fillRect(0, 0, 512, 256);
    
    // Header
    ctx.fillStyle = '#ff3e6c'; ctx.font = 'bold 32px Arial';
    ctx.fillText("EMARI MEGA BANK", 30, 60);

    // Card Details
    ctx.fillStyle = '#ffffff'; ctx.font = '18px Courier';
    ctx.fillText("ACCOUNT HOLDER", 30, 150);
    ctx.font = '22px Courier';
    ctx.fillText(uuid.substring(0, 18).toUpperCase(), 30, 180);

    // Balance Display
    ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 28px Arial';
    ctx.fillText("BAL: L$" + acc.checking.toLocaleString(), 30, 225);

    // Chip Graphic
    ctx.fillStyle = '#d4af37'; ctx.fillRect(420, 40, 60, 45);

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

app.listen(port, () => {
    console.log(`🚀 Emari Mega Bank Server listening on port ${port}`);
});
