const express = require('express');
const { createCanvas } = require('canvas');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// --- DATABASE ---
let accounts = {};
const DB_FILE = './database.json';
if (fs.existsSync(DB_FILE)) { accounts = JSON.parse(fs.readFileSync(DB_FILE)); }
const saveDB = () => { fs.writeFileSync(DB_FILE, JSON.stringify(accounts, null, 2)); };

// --- ROUTES ---

// Homepage
app.get('/', (req, res) => {
    res.send("<h1 style='font-family:sans-serif;'>🏦 Emari Bank Vault Online</h1>");
});

// The Banking API
app.post('/bank', (req, res) => {
    const [secret, action, user, value] = req.body.split('|');
    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    if (!accounts[user]) {
        accounts[user] = { checking: 0, savings: 0, pin: "NONE", kin: "NONE", hasCard: 0, isKid: 0, logs: [] };
    }
    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT": res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}|${acc.hasCard}|${acc.isKid}`); break;
        case "DEPOSIT": 
            acc.checking += parseInt(value); 
            acc.logs.push(`+L$${value} Dep`); saveDB(); res.send("SUCCESS"); break;
        case "ISSUE_CARD": acc.hasCard = 1; saveDB(); res.send("CARD_ISSUED"); break;
        case "WITHDRAW":
            let amt = parseInt(value);
            if (acc.checking >= amt) { acc.checking -= amt; saveDB(); res.send("SUCCESS"); } 
            else res.send("INSUFFICIENT"); break;
        // Add other cases (TO_SAVINGS, etc.) here as needed
    }
});

// The Card Image Generator
// URL: https://emari-bank-vault.onrender.com/card/USER_UUID
app.get('/card/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const acc = accounts[uuid] || { checking: 0 };
    
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext('2d');

    // Card Design
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#ff3e6c'; ctx.font = 'bold 30px Arial'; ctx.fillText("EMARI MEGA BANK", 30, 50);
    
    ctx.fillStyle = '#ffffff'; ctx.font = '18px Courier';
    ctx.fillText("HOLDER: " + uuid.substring(0, 18), 30, 180);
    
    ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 28px Arial';
    ctx.fillText("BAL: L$" + acc.checking.toLocaleString(), 30, 225);

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

app.listen(port, () => console.log(`Vault running on ${port}`));
