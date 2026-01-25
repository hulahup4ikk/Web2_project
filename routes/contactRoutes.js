const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.post('/', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).send('Missing required fields: name, email, or message');
    }

    console.log('Received form data:', req.body);

    const newMessage = {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    };

    let messages = [];
    if (fs.existsSync('messages.json')) {
        messages = JSON.parse(fs.readFileSync('messages.json'));
    }
    messages.push(newMessage);
    fs.writeFile('messages.json', JSON.stringify(messages, null, 2), (err) => {
        if (err) return res.status(500).send('Server error');
        res.sendFile(path.join(__dirname, '..', 'views', 'contact-success.html'));
    });
});

module.exports = router;