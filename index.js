const express = require('express');
const { createCanvas } = require('canvas');
const fs = require('fs'); // File System to save data
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// --- DATABASE PERSISTENCE ---
let accounts = {};
const DB_FILE = './database.json';

// Load existing data on startup
if (fs.existsSync(DB_FILE)) {
    accounts = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(accounts, null, 2));
};

// --- BANKING API ---
app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    // Initialize Mega Account Structure
    if (!accounts[user]) {
        accounts[user] = { 
            checking: 0, 
            savings: 0, 
            pin: "NONE", 
            kin: "None Set", 
            hasCard: 0, 
            isKid: 0, 
            linked: [],
            logs: []
        };
        saveDB();
    }
    
    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT":
            res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}|${acc.hasCard}|${acc.isKid}|${acc.linked.length}`);
            break;

        case "ISSUE_CARD":
            acc.hasCard = 1;
            acc.logs.push(`Card Issued on ${new Date().toLocaleDateString()}`);
            saveDB();
            res.send("CARD_ISSUED");
            break;

        case "DEPOSIT":
            acc.checking += parseInt(value);
            acc.logs.push(`Dep L$${value} on ${new Date().toLocaleDateString()}`);
            saveDB();
            res.send("SUCCESS");
            break;

        case "WITHDRAW":
            let wAmt = parseInt(value);
            if (acc.checking >= wAmt) {
                acc.checking -= wAmt;
                acc.logs.push(`With L$${value} on ${new Date().toLocaleDateString()}`);
                saveDB();
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "TO_SAVINGS":
            let sAmt = parseInt(value);
            if (acc.checking >= sAmt) {
                acc.checking -= sAmt;
                acc.savings += sAmt;
                saveDB();
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "FROM_SAVINGS":
            let cAmt = parseInt(value);
            if (acc.savings >= cAmt) {
                acc.savings -= cAmt;
                acc.checking += cAmt;
                saveDB();
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "SET_PIN":
            acc.pin = value;
            saveDB();
            res.send("SUCCESS");
            break;

        default:
            res.send("UNKNOWN_ACTION");
    }
});

// --- CARD IMAGE GENERATOR ---
app.get('/card/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const acc = accounts[uuid] || { checking: 0 };
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext('2d');

    // Design the Card
    ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px Arial';
    ctx.fillText("EMARI MEGA BANK", 30, 50);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '20px Courier';
    ctx.fillText("HOLDER: " + uuid.substring(0, 15), 30, 180);
    ctx.font = 'bold 26px Arial';
    ctx.fillText("BAL: L$" + acc.checking, 30, 220);

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

app.listen(port, () => console.log(`Server Active with File Persistence`));
