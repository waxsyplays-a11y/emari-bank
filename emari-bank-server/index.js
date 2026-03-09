const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text());

// This is your temporary database (In-memory)
// NOTE: Free Tier resets memory if the service sleeps. 
// For permanent storage, you'd later link a free MongoDB or Disk.
let balances = {}; 
let pins = {};

app.post('/bank', (req, res) => {
    const data = req.body.split('|');
    const [secret, action, user, value] = data;

    if (secret !== "MY_SUPER_SECRET_123") return res.status(403).send("Wrong Secret");

    if (action === "GET_USER") {
        res.send(`${balances[user] || 0}|${pins[user] || "NONE"}`);
    } 
    else if (action === "SET_BAL") {
        balances[user] = value;
        res.send("SUCCESS");
    }
    else if (action === "SET_PIN") {
        pins[user] = value;
        res.send("SUCCESS");
    }
});

app.listen(port, () => console.log(`Bank active on port ${port}`));