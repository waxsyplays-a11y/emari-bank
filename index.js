const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// Central Database Object
let accounts = {}; 

app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value, extra] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    // Initialize user if they don't exist
    if (!accounts[user]) {
        accounts[user] = { checking: 0, savings: 0, pin: "NONE", kin: "None Set" };
    }

    let acc = accounts[user];

    switch (action) {
        case "GET_ACCOUNT":
            res.send(`${acc.checking}|${acc.savings}|${acc.pin}|${acc.kin}`);
            break;

        case "DEPOSIT":
            acc.checking += parseInt(value);
            res.send("SUCCESS");
            break;

        case "SET_PIN":
            acc.pin = value;
            res.send("SUCCESS");
            break;

        case "SET_KIN":
            acc.kin = value;
            res.send("SUCCESS");
            break;

        case "TO_SAVINGS": // Move Current -> Savings
            let toSave = parseInt(value);
            if (acc.checking >= toSave) {
                acc.checking -= toSave;
                acc.savings += toSave;
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "FROM_SAVINGS": // Move Savings -> Current
            let fromSave = parseInt(value);
            if (acc.savings >= fromSave) {
                acc.savings -= fromSave;
                acc.checking += fromSave;
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        case "WITHDRAW": // Direct L$ Withdrawal from Current
            let withdrawAmt = parseInt(value);
            if (acc.checking >= withdrawAmt) {
                acc.checking -= withdrawAmt;
                res.send("SUCCESS");
            } else res.send("INSUFFICIENT");
            break;

        default:
            res.send("UNKNOWN_ACTION");
    }
});

app.listen(port, () => console.log(`EMARI Mega Bank: Phase A Online`));
