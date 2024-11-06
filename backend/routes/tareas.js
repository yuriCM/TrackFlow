const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Endpoint para obtener tareas por máquina
router.get('/api/tareas/:maquinaId', authenticateToken, async (req, res) => {
    try {
        const { maquinaId } = req.params;
        
        const result = await pool.query(
            'SELECT id, nombre_tarea FROM lista_de_tareas WHERE maquina_id = $1 ORDER BY id',
            [maquinaId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ error: 'Error al obtener las tareas' });
    }
});

// Agregar esta nueva ruta para obtener los motivos
router.get('/api/motivos', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre_motivo FROM motivo_cambio ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener motivos:', error);
        res.status(500).json({ error: 'Error al obtener los motivos' });
    }
});

module.exports = router; 