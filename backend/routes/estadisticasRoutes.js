const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para obtener componentes críticos
router.get('/api/estadisticas/componentes', authenticateToken, async (req, res) => {
    try {
        const { maquina } = req.query;
        let query = `
            SELECT 
                m.nombre as maquina,
                c.nombre as componente,
                c.fecha_instalacion as instalacion,
                c.vida_util as "vidaUtil",
                c.tiempo_restante as "tiempoRestante",
                c.estado
            FROM componentes c
            JOIN maquinas m ON c.maquina_id = m.id
        `;

        if (maquina) {
            query += ` WHERE m.nombre = $1`;
        }

        query += ` ORDER BY c.tiempo_restante ASC`;

        const result = await pool.query(query, maquina ? [maquina] : []);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener componentes críticos' });
    }
});

// Ruta para obtener métricas
router.get('/api/estadisticas/metricas', authenticateToken, async (req, res) => {
    try {
        const { maquina } = req.query;
        // Aquí implementarías la lógica para obtener las métricas de la base de datos
        // Por ahora retornamos datos de ejemplo
        res.json({
            tareasCompletadas: 156,
            mantenimientosPendientes: 8,
            tiempoPromedio: "2.5h",
            eficiencia: "95%"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

module.exports = router; 