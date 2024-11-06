const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/api/maquinas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM maquinas ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener máquinas:', error);
        res.status(500).json({ error: 'Error al obtener las máquinas' });
    }
});

module.exports = router; 