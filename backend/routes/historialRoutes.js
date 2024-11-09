const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/historial', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Consulta simplificada usando solo IDs
        const query = `
            SELECT 
                id,
                usuario_id,
                maquina_id,
                tarea_id,
                motivo_id,
                fecha,
                created_at
            FROM tareas_realizadas
            ORDER BY fecha DESC
            LIMIT $1 
            OFFSET $2
        `;

        console.log('Ejecutando consulta...'); // Debug
        const result = await pool.query(query, [limit, offset]);
        console.log('Resultados:', result.rows); // Debug

        // Obtener el total de registros para la paginación
        const totalQuery = 'SELECT COUNT(*) FROM tareas_realizadas';
        const totalResult = await pool.query(totalQuery);
        const totalPages = Math.ceil(totalResult.rows[0].count / limit);

        res.json({
            tareas: result.rows,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error('Error en historial:', error);
        res.status(500).json({ 
            error: 'Error al obtener el historial',
            details: error.message 
        });
    }
});

module.exports = router; 