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

module.exports = router; 