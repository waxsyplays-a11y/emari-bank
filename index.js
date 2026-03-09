const express = require('express');
const { createCanvas } = require('canvas');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// Central Database
let accounts = {}; 

// --- BANKING API ---
app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    if (!accounts[user]) {
        accounts[user] = { checking: 0, savings: 0, pin: "NONE", kin: "None Set", hasCard: 0, isKid: 0, linked: [] };
    }
    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT":
            res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}|${acc.hasCard}|${acc.isKid}|${acc.linked.length}`);
            break;
        case "ISSUE_CARD":
            acc.hasCard = 1;
            res.send("SUCCESS");
            break;
        case "DEPOSIT":
            acc.checking += parseInt(value);
            res.send("SUCCESS");
            break;
        case "WITHDRAW":
            let amt = parseInt(value);
            if (acc.checking >= amt) { acc.checking -= amt; res.send("SUCCESS"); }
            else res.send("INSUFFICIENT");
            break;
        case "TO_SAVINGS":
            if (acc.checking >= parseInt(value)) { acc.checking -= parseInt(value); acc.savings += parseInt(value); res.send("SUCCESS"); }
            else res.send("INSUFFICIENT");
            break;
        case "FROM_SAVINGS":
            if (acc.savings >= parseInt(value)) { acc.savings -= parseInt(value); acc.checking += parseInt(value); res.send("SUCCESS"); }
            else res.send("INSUFFICIENT");
            break;
        case "SET_PIN": acc.pin = value; res.send("SUCCESS"); break;
        case "SET_KIN": acc.kin = value; res.send("SUCCESS"); break;
        default: res.send("UNKNOWN");
    }
});

// --- DYNAMIC CARD IMAGE GENERATOR ---
app.get('/card/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const acc = accounts[uuid] || { checking: 0 };
    
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext('2d');

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Bank Branding
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px Arial';
    ctx.fillText("EMARI MEGA BANK", 30, 60);

    // Chip Decoration
    ctx.fillStyle = '#f9a825';
    ctx.fillRect(40, 90, 60, 45);

    // User Data
    ctx.fillStyle = 'white';
    ctx.font = '20px Courier New';
    ctx.fillText("HOLDER: " + uuid.substring(0, 13).toUpperCase(), 40, 190);
    ctx.font = 'bold 24px Arial';
    ctx.fillText("BAL: L$" + acc.checking.toLocaleString(), 40, 225);

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

app.listen(port, () => console.log(`Emari Server Running on ${port}`));
