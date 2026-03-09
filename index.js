const express = require('express');
const { createCanvas } = require('canvas');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// --- DATABASE SETUP ---
let accounts = {};
const DB_FILE = './database.json';

if (fs.existsSync(DB_FILE)) {
    accounts = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(accounts, null, 2));
};

// --- BANKING LOGIC ---
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
                acc.logs.push(`[${new Date().toLocaleDateString()}] Moved L$${sAmt} to Savings`);
                saveDB(); res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "FROM_SAVINGS":
            let fAmt = parseInt(value);
            if (acc.savings >= fAmt) {
                acc.savings -= fAmt; acc.checking += fAmt;
                acc.logs.push(`[${new Date().toLocaleDateString()}] Moved L$${fAmt} to Current`);
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
                acc.logs.push(`[${new Date().toLocaleDateString()}] Inherited L$${total} from ${value}`);
                saveDB(); res.send("CLAIMED|" + total);
            } else res.send("DENIED");
            break;
    }
});

// --- DYNAMIC CARD IMAGE ---
app.get('/card/:uuid', (req, res) => {
    const acc = accounts[req.params.uuid] || { checking: 0 };
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#e94560'; ctx.font = 'bold 30px Arial'; ctx.fillText("EMARI MEGA BANK", 30, 50);
    ctx.fillStyle = '#ffffff'; ctx.font = '20px Courier'; ctx.fillText("HOLDER: " + req.params.uuid.substring(0, 15), 30, 180);
    ctx.font = 'bold 24px Arial'; ctx.fillText("BAL: L$" + acc.checking, 30, 220);
    res.set('Content-Type', 'image/png'); res.send(canvas.toBuffer());
});

app.listen(port);
