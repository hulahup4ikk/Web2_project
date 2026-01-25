const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Search Task - Easy ToDo</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
        <div class="container">
            <header class="topbar">
                <nav>
                    <ul class="nav">
                        <li><a class="nav-link" href="/">Home</a></li>
                        <li><a class="nav-link" href="/about">About</a></li>
                        <li><a class="nav-link" href="/contact">Contact</a></li>
                        <li><a class="nav-link" href="/search">Search</a></li>
                    </ul>
                </nav>
            </header>

            <h1 class="title">Search Tasks</h1>
            
            <section class="card">
                <h2>Find Task by ID</h2>
                <div class="row row-wide">
                    <input type="text" id="search-id-input" class="input" placeholder="Paste MongoDB Task ID here...">
                    <button onclick="findTaskById()" class="btn btn-primary">Search</button>
                </div>
                <p class="hint">Enter a MongoDB ObjectId to find a specific task</p>
            </section>

            <section class="card" id="search-result-section" style="display: none;">
                <h2>Search Result</h2>
                <div id="search-result-display"></div>
            </section>

            <footer class="footer">
                <p>Web Programming 2 - Easy ToDo Project</p>
            </footer>
        </div>

        <script>
            const API_URL = '/api/tasks';

            async function findTaskById() {
                const idInput = document.getElementById('search-id-input');
                const resultSection = document.getElementById('search-result-section');
                const display = document.getElementById('search-result-display');
                const id = idInput.value.trim();

                if (!id) {
                    alert("Please enter an ID");
                    return;
                }

                resultSection.style.display = 'block';

                try {
                    const res = await fetch(\`\${API_URL}/\${id}\`);
                    const data = await res.json();

                    if (!res.ok) {
                        display.innerHTML = \`<div class="task" style="border-left: 4px solid var(--red);"><p style="color: var(--red); margin: 0;">\${data.error || 'Task not found'}</p></div>\`;
                    } else {
                        display.innerHTML = \`
                            <div class="task" style="border-left: 4px solid var(--blue);">
                                <div class="task-left">
                                    <div class="task-title">\${data.title}</div>
                                    <div class="task-desc">Status: \${data.is_done ? '✅ Completed' : '⏳ Pending'}</div>
                                    <div class="task-meta">Created: \${new Date(data.created_at).toLocaleString()}</div>
                                    \${data.description ? \`<div class="task-desc">Description: \${data.description}</div>\` : ''}
                                </div>
                            </div>
                        \`;
                    }
                } catch (err) {
                    display.innerHTML = \`<div class="task" style="border-left: 4px solid var(--red);"><p style="color: var(--red); margin: 0;">Error connecting to server</p></div>\`;
                }
            }

            // Allow Enter key to trigger search
            document.getElementById('search-id-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    findTaskById();
                }
            });
        </script>
        </body>
        </html>
    `);
});

module.exports = router;
module.exports = router;