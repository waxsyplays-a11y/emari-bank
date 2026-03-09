const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// The "Big Ledger" - Stores everything in one place
let database = {}; 

app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value, extra] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    // Create account if it doesn't exist
    if (!database[user]) {
        database[user] = { checking: 0, savings: 0, pin: "NONE", kin: "None Set" };
    }

    let acc = database[user];

    if (action === "GET_ACCOUNT") {
        // Returns: Checking|Savings|PIN|Kin
        res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}`);
    } 
    else if (action === "DEPOSIT") {
        acc.checking += parseInt(value);
        res.send("SUCCESS");
    }
    else if (action === "SET_PIN") {
        acc.pin = value;
        res.send("SUCCESS");
    }
    else if (action === "TO_SAVINGS") {
        let amount = parseInt(value);
        if (acc.checking >= amount) {
            acc.checking -= amount;
            acc.savings += amount;
            res.send("SUCCESS");
        } else {
            res.send("INSUFFICIENT");
        }
    }
    else if (action === "FROM_SAVINGS") {
        let amount = parseInt(value);
        if (acc.savings >= amount) {
            acc.savings -= amount;
            acc.checking += amount;
            res.send("SUCCESS");
        } else {
            res.send("INSUFFICIENT");
        }
    }
    else if (action === "SET_KIN") {
        acc.kin = value; // 'value' will be the name or UUID of the Kin
        res.send("SUCCESS");
    }
});

app.listen(port, () => console.log(`Mega Bank Phase A Active`));
