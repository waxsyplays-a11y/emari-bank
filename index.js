const express = require('express');
const app = express();
app.use(express.json()); // Support complex data

let accounts = {}; // Our "Big Book" of accounts

app.post('/bank/action', (req, res) => {
    const { secret, action, user, target, value } = req.body;
    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Unauthorized");

    // Initialize account if new
    if (!accounts[user]) {
        accounts[user] = { balance: 0, savings: 0, pin: "NONE", linked: [], kin: "NONE", logs: [], isKid: false };
    }

    let acc = accounts[user];

    switch(action) {
        case "GET_ALL":
            res.json(acc);
            break;

        case "ADD_LINK": // Add user to card
            acc.linked.push(target);
            acc.logs.push(`Added linked user: ${target}`);
            res.send("User Linked");
            break;

        case "XFER_SAVINGS": // Move to savings
            let amt = parseInt(value);
            if(acc.balance >= amt) {
                acc.balance -= amt;
                acc.savings += amt;
                acc.logs.push(`Saved L$${amt}`);
                res.send("Saved");
            } else res.status(400).send("No Funds");
            break;

        case "GET_LOGS":
            res.send(acc.logs.slice(-5).join("\n")); // Send last 5 actions
            break;
            
        case "SET_KIN":
            acc.kin = target;
            res.send("Next of Kin Updated");
            break;
    }
});

app.listen(process.env.PORT || 3000);
