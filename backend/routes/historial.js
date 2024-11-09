const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Endpoint para obtener el historial paginado y filtrado
router.get('/api/historial', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const maquinaFilter = req.query.maquina;

        let whereClause = '';
        const params = [];
        
        if (maquinaFilter) {
            whereClause = 'WHERE m.nombre = $1';
            params.push(maquinaFilter);
        }

        const query = `
            SELECT 
                tr.id,
                t.nombre_tarea,
                m.nombre as maquina,
                TO_CHAR(tr.fecha, 'DD-MM-YYYY') as fecha,
                mc.nombre_motivo as motivo,
                u.nombre as realizado_por
            FROM tareas_realizadas tr
            LEFT JOIN lista_de_tareas t ON tr.tarea_id = t.id
            LEFT JOIN maquinas m ON tr.maquina_id = m.id
            LEFT JOIN motivo_cambio mc ON tr.motivo_id = mc.id
            LEFT JOIN usuarios u ON tr.usuario_id = u.id
            ${whereClause}
            ORDER BY tr.fecha DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        params.push(limit, offset);
        const result = await pool.query(query, params);
        
        // Obtener el total de registros para la paginación
        const totalQuery = `
            SELECT COUNT(*) 
            FROM tareas_realizadas tr
            LEFT JOIN maquinas m ON tr.maquina_id = m.id
            ${whereClause}
        `;
        
        const totalResult = await pool.query(totalQuery, params.slice(0, 1));
        const totalTareas = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalTareas / limit);

        res.json({
            tareas: result.rows,
            totalPages: totalPages,
            currentPage: page,
            maquinaActual: maquinaFilter || null
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
});

module.exports = router; 