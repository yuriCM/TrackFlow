const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Endpoint para obtener tareas por máquina (simplificado)
router.get('/api/tareas/:maquinaId', authenticateToken, async (req, res) => {
    try {
        const { maquinaId } = req.params;
        
        const result = await pool.query(
            'SELECT id, maquina_id, nombre_tarea FROM lista_de_tareas WHERE maquina_id = $1',
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

// Agregar nueva ruta para guardar tareas realizadas
router.post('/api/tareas-realizadas', authenticateToken, async (req, res) => {
    try {
        const { maquina_id, tarea_id, motivo_id, fecha } = req.body;
        const usuario_id = req.user.id; // Obtenemos el ID del usuario del token

        // Validar que todos los campos requeridos estén presentes
        if (!maquina_id || !tarea_id || !motivo_id || !fecha) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Insertar en la base de datos
        const query = `
            INSERT INTO tareas_realizadas 
            (usuario_id, maquina_id, tarea_id, motivo_id, fecha)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            usuario_id,
            maquina_id,
            tarea_id,
            motivo_id,
            fecha
        ]);

        res.status(201).json({
            message: 'Tarea registrada exitosamente',
            tarea: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar tarea:', error);
        res.status(500).json({ error: 'Error al registrar la tarea' });
    }
});

// Endpoint para crear nueva tarea (simplificado)
router.post('/api/nueva-tarea', authenticateToken, async (req, res) => {
    try {
        const { maquina_id, nombre_tarea } = req.body;

        // Validar campos requeridos
        if (!maquina_id || !nombre_tarea) {
            return res.status(400).json({ error: 'Máquina y nombre de tarea son requeridos' });
        }

        // Insertar solo los campos necesarios
        const query = `
            INSERT INTO lista_de_tareas 
            (maquina_id, nombre_tarea)
            VALUES ($1, $2)
            RETURNING id, nombre_tarea
        `;
        
        const result = await pool.query(query, [maquina_id, nombre_tarea]);

        res.status(201).json({
            message: 'Tarea creada exitosamente',
            tarea: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

// Endpoint para eliminar tarea
router.delete('/api/tareas/eliminar', authenticateToken, async (req, res) => {
    try {
        const { maquina_id, nombre_tarea } = req.body;

        // Validar que se reciban ambos campos
        if (!maquina_id || !nombre_tarea) {
            return res.status(400).json({ error: 'Se requiere máquina y nombre de tarea' });
        }

        // Eliminar la tarea
        const result = await pool.query(
            'DELETE FROM lista_de_tareas WHERE maquina_id = $1 AND nombre_tarea = $2 RETURNING *',
            [maquina_id, nombre_tarea]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Tarea eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

// Endpoint para obtener las últimas tareas
router.get('/api/ultimas-tareas/:maquinaId', authenticateToken, async (req, res) => {
    try {
        const { maquinaId } = req.params;
        
        const result = await pool.query(
            'SELECT nombre_tarea FROM lista_de_tareas WHERE maquina_id = $1 ORDER BY id DESC LIMIT 2',
            [maquinaId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener últimas tareas:', error);
        res.status(500).json({ error: 'Error al obtener las tareas' });
    }
});

// Endpoint para obtener el historial paginado y filtrado
router.get('/api/historial', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const maquinaFilter = req.query.maquina; // Nuevo parámetro para filtrar

        // Construir la consulta base
        let whereClause = '';
        const params = [];
        
        if (maquinaFilter) {
            whereClause = 'WHERE m.nombre = $1';
            params.push(maquinaFilter);
        }

        // Consulta para el total de registros con filtro
        const totalQuery = `
            SELECT COUNT(*) 
            FROM tareas_realizadas tr
            LEFT JOIN maquinas m ON tr.maquina_id = m.id
            ${whereClause}
        `;
        
        const totalResult = await pool.query(totalQuery, params);
        const totalTareas = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalTareas / limit);

        // Consulta paginada con filtro
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