const express = require('express');
const router = express.Router();

router.get('/info', (req, res) => {
    res.status(200).json({
        project: 'Easy ToDo',
        version: '1.0.0',
        description: 'A simple task management application',
        team: [
            'Kuznetsov Ivan',
            'Yskak Zhanibek',
            'Zhumagali Beibarys',
            'Adilzhan Assanuly'
        ],
        routes: [
            { path: '/', method: 'GET', description: 'Home page' },
            { path: '/about', method: 'GET', description: 'About page' },
            { path: '/contact', method: 'GET', description: 'Contact form page' },
            { path: '/contact', method: 'POST', description: 'Submit contact form' },
            { path: '/search?q=query', method: 'GET', description: 'Search with query parameter' },
            { path: '/item/:id', method: 'GET', description: 'Item details with route parameter' },
            { path: '/api/info', method: 'GET', description: 'Project info in JSON' }
        ]
    });
});

module.exports = router;