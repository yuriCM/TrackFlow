const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para obtener componentes críticos
router.get('/api/estadisticas/componentes', authenticateToken, async (req, res) => {
    try {
        const { maquina, page = 1 } = req.query;
        const itemsPerPage = 20;
        const offset = (page - 1) * itemsPerPage;

        let query = `
            WITH tareas_frecuentes AS (
                SELECT 
                    lt.nombre_tarea,
                    m.nombre as maquina_nombre,
                    COUNT(*) as cantidad_registros,
                    MAX(tr.fecha) as ultima_instalacion
                FROM tareas_realizadas tr
                JOIN maquinas m ON tr.maquina_id = m.id
                JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                GROUP BY lt.nombre_tarea, m.nombre
                HAVING COUNT(*) >= 2
            ),
            tiempo_entre_cambios AS (
                SELECT 
                    lt.nombre_tarea,
                    m.nombre as maquina_nombre,
                    tr.fecha,
                    LAG(tr.fecha) OVER (
                        PARTITION BY lt.nombre_tarea, m.nombre 
                        ORDER BY tr.fecha
                    ) as fecha_anterior
                FROM tareas_realizadas tr
                JOIN maquinas m ON tr.maquina_id = m.id
                JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                JOIN tareas_frecuentes tf ON 
                    tf.nombre_tarea = lt.nombre_tarea AND 
                    tf.maquina_nombre = m.nombre
            ),
            promedio_vida_util AS (
                SELECT 
                    nombre_tarea,
                    maquina_nombre,
                    ROUND(AVG(
                        CASE 
                            WHEN fecha_anterior IS NOT NULL 
                            THEN fecha - fecha_anterior 
                            ELSE NULL 
                        END
                    )) as promedio_dias
                FROM tiempo_entre_cambios
                GROUP BY nombre_tarea, maquina_nombre
            ),
            fecha_proximo_cambio AS (
                SELECT 
                    tf.nombre_tarea,
                    tf.maquina_nombre,
                    tf.ultima_instalacion,
                    pvu.promedio_dias,
                    tf.ultima_instalacion + (pvu.promedio_dias || ' days')::interval as fecha_cambio
                FROM tareas_frecuentes tf
                JOIN promedio_vida_util pvu ON 
                    pvu.nombre_tarea = tf.nombre_tarea AND 
                    pvu.maquina_nombre = tf.maquina_nombre
            )
            SELECT DISTINCT
                m.nombre as maquina,
                lt.nombre_tarea as componente,
                tf.ultima_instalacion as instalacion,
                COALESCE(
                    CASE 
                        WHEN pvu.promedio_dias IS NULL THEN '12 meses'
                        WHEN pvu.promedio_dias < 365 THEN pvu.promedio_dias || ' días'
                        ELSE ROUND(pvu.promedio_dias/365, 1) || ' años'
                    END,
                    '12 meses'
                ) as "vidaUtil",
                CASE
                    WHEN fpc.fecha_cambio IS NOT NULL THEN
                        CASE
                            WHEN fpc.fecha_cambio > CURRENT_DATE THEN
                                EXTRACT(DAY FROM (fpc.fecha_cambio - CURRENT_DATE))::text || ' días'
                            ELSE 'Vencido'
                        END
                    ELSE 'Por calcular'
                END as "tiempoRestante",
                CASE
                    WHEN fpc.fecha_cambio IS NOT NULL THEN
                        CASE
                            WHEN EXTRACT(DAY FROM (fpc.fecha_cambio - CURRENT_DATE)) <= 7 THEN 'Advertencia'
                            ELSE 'Normal'
                        END
                    ELSE 'Normal'
                END as estado
            FROM tareas_realizadas tr
            JOIN maquinas m ON tr.maquina_id = m.id
            JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
            JOIN tareas_frecuentes tf ON 
                tf.nombre_tarea = lt.nombre_tarea AND 
                tf.maquina_nombre = m.nombre
            LEFT JOIN promedio_vida_util pvu ON 
                pvu.nombre_tarea = lt.nombre_tarea AND 
                pvu.maquina_nombre = m.nombre
            LEFT JOIN fecha_proximo_cambio fpc ON 
                fpc.nombre_tarea = lt.nombre_tarea AND 
                fpc.maquina_nombre = m.nombre
        `;

        if (maquina) {
            query += ` WHERE m.nombre = $1`;
        }

        let countQuery = `
            WITH tareas_frecuentes AS (
                SELECT 
                    lt.nombre_tarea,
                    m.nombre as maquina_nombre
                FROM tareas_realizadas tr
                JOIN maquinas m ON tr.maquina_id = m.id
                JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                GROUP BY lt.nombre_tarea, m.nombre
                HAVING COUNT(*) >= 2
            )
            SELECT COUNT(DISTINCT lt.nombre_tarea) 
            FROM tareas_realizadas tr
            JOIN maquinas m ON tr.maquina_id = m.id
            JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
            JOIN tareas_frecuentes tf ON 
                tf.nombre_tarea = lt.nombre_tarea AND 
                tf.maquina_nombre = m.nombre
        `;

        if (maquina) {
            countQuery += ` WHERE m.nombre = $1`;
        }

        query += ` ORDER BY tf.ultima_instalacion DESC
                  LIMIT ${itemsPerPage} OFFSET ${offset}`;

        const totalCount = await pool.query(countQuery, maquina ? [maquina] : []);
        const result = await pool.query(query, maquina ? [maquina] : []);
        const totalPages = Math.ceil(totalCount.rows[0].count / itemsPerPage);

        return res.json({
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: parseInt(totalCount.rows[0].count),
                itemsPerPage
            }
        });
    } catch (error) {
        console.error('Error detallado:', error);
        return res.status(500).json({
            error: 'Error al obtener componentes críticos',
            details: error.message
        });
    }
});

// Ruta para obtener métricas
router.get('/api/estadisticas/metricas', authenticateToken, async (req, res) => {
    try {
        const { maquina } = req.query;

        // Query para obtener las métricas
        let metricsQuery = `
            WITH tareas_frecuentes AS (
                SELECT 
                    lt.nombre_tarea,
                    m.nombre as maquina_nombre,
                    COUNT(*) as cantidad_registros,
                    MAX(tr.fecha) as ultima_instalacion
                FROM tareas_realizadas tr
                JOIN maquinas m ON tr.maquina_id = m.id
                JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                GROUP BY lt.nombre_tarea, m.nombre
                HAVING COUNT(*) >= 2
            ),
            tiempo_entre_cambios AS (
                SELECT 
                    lt.nombre_tarea,
                    m.nombre as maquina_nombre,
                    tr.fecha,
                    LAG(tr.fecha) OVER (
                        PARTITION BY lt.nombre_tarea, m.nombre 
                        ORDER BY tr.fecha
                    ) as fecha_anterior
                FROM tareas_realizadas tr
                JOIN maquinas m ON tr.maquina_id = m.id
                JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                JOIN tareas_frecuentes tf ON 
                    tf.nombre_tarea = lt.nombre_tarea AND 
                    tf.maquina_nombre = m.nombre
            ),
            promedio_vida_util AS (
                SELECT 
                    nombre_tarea,
                    maquina_nombre,
                    ROUND(AVG(
                        CASE 
                            WHEN fecha_anterior IS NOT NULL 
                            THEN fecha - fecha_anterior 
                            ELSE NULL 
                        END
                    )) as promedio_dias
                FROM tiempo_entre_cambios
                GROUP BY nombre_tarea, maquina_nombre
            ),
            fecha_proximo_cambio AS (
                SELECT 
                    tf.nombre_tarea,
                    tf.maquina_nombre,
                    tf.ultima_instalacion,
                    pvu.promedio_dias,
                    tf.ultima_instalacion + (pvu.promedio_dias || ' days')::interval as fecha_cambio
                FROM tareas_frecuentes tf
                JOIN promedio_vida_util pvu ON 
                    pvu.nombre_tarea = tf.nombre_tarea AND 
                    pvu.maquina_nombre = tf.maquina_nombre
            ),
            tareas_advertencia AS (
                SELECT COUNT(*) as warning_count
                FROM (
                    SELECT DISTINCT
                        lt.nombre_tarea,
                        m.nombre as maquina,
                        CASE
                            WHEN fpc.fecha_cambio IS NOT NULL THEN
                                CASE
                                    WHEN EXTRACT(DAY FROM (fpc.fecha_cambio - CURRENT_DATE)) <= 7 THEN 'Advertencia'
                                    ELSE 'Normal'
                                END
                            ELSE 'Normal'
                        END as estado
                    FROM tareas_realizadas tr
                    JOIN maquinas m ON tr.maquina_id = m.id
                    JOIN lista_de_tareas lt ON tr.tarea_id = lt.id
                    JOIN tareas_frecuentes tf ON 
                        tf.nombre_tarea = lt.nombre_tarea AND 
                        tf.maquina_nombre = m.nombre
                    LEFT JOIN fecha_proximo_cambio fpc ON 
                        fpc.nombre_tarea = lt.nombre_tarea AND 
                        fpc.maquina_nombre = m.nombre
                    ${maquina ? 'WHERE m.nombre = $1' : ''}
                ) subquery
                WHERE estado = 'Advertencia'
            )
            SELECT 
                (SELECT COUNT(*) FROM tareas_realizadas) as tareas_completadas,
                (SELECT warning_count FROM tareas_advertencia) as mantenimientos_pendientes
        `;

        const result = await pool.query(metricsQuery, maquina ? [maquina] : []);
        
        res.json({
            tareasCompletadas: parseInt(result.rows[0].tareas_completadas),
            mantenimientosPendientes: parseInt(result.rows[0].mantenimientos_pendientes),
            tiempoPromedio: "2.5h",
            eficiencia: "95%"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

module.exports = router; 