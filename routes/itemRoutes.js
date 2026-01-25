const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).send('Invalid or missing item ID');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Item Details - Easy ToDo</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
        <div class="container">
            <header>
                <nav>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/about">About</a></li>
                        <li><a href="/contact">Contact</a></li>
                        <li><a href="/search?q=test">Search</a></li>
                        <li><a href="/item/1">Item Example</a></li>
                    </ul>
                </nav>
            </header>
            <h1>Item Details for ID ${id}</h1>
            <p class="description">This is a placeholder for viewing a specific task or item by ID.</p>
            <section>
                <h2>Item Info</h2>
                <p>Details for item ${id} would be displayed here in future versions.</p>
            </section>
            <footer>
                <p>Web Programming 2 - Easy ToDo Project</p>
            </footer>
        </div>
        </body>
        </html>
    `);
});

module.exports = router;