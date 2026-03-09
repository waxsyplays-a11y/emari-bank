const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

let accounts = {}; 

app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value, extra] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    // Initialize account with all Phase A & B features
    if (!accounts[user]) {
        accounts[user] = { 
            checking: 0, savings: 0, pin: "NONE", 
            kin: "None Set", hasCard: false, linked: [], 
            isKid: false, limit: 50 
        };
    }

    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT":
            // Returns: Checking|Savings|PIN|Kin|hasCard|isKid|linkedCount
            res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}|${acc.hasCard ? 1:0}|${acc.isKid ? 1:0}|${acc.linked.length}`);
            break;

        case "ISSUE_CARD":
            acc.hasCard = true;
            res.send("SUCCESS");
            break;

        case "ADD_LINK":
            if (!acc.linked.includes(value)) {
                acc.linked.push(value);
                res.send("SUCCESS");
            } else res.send("ALREADY_LINKED");
            break;

        case "DEPOSIT":
            acc.checking += parseInt(value);
            res.send("SUCCESS");
            break;

        case "WITHDRAW":
            let amt = parseInt(value);
            // Kids Account Logic: Prevent withdrawing more than their limit
            if (acc.isKid && amt > acc.limit) return res.send("KID_LIMIT_REACHED");
            
            if (acc.checking >= amt) {
                acc.checking -= amt;
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "TO_SAVINGS":
            if (acc.checking >= parseInt(value)) {
                acc.checking -= parseInt(value);
                acc.savings += parseInt(value);
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "FROM_SAVINGS":
            if (acc.savings >= parseInt(value)) {
                acc.savings -= parseInt(value);
                acc.checking += parseInt(value);
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "SET_PIN": acc.pin = value; res.send("SUCCESS"); break;
        case "SET_KIN": acc.kin = value; res.send("SUCCESS"); break;
        case "SET_KID": acc.isKid = (value === "1"); res.send("SUCCESS"); break;

        default: res.send("UNKNOWN_ACTION");
    }
});

app.listen(port, () => console.log(`Mega Bank Server Online`));
