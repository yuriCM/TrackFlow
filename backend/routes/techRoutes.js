const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const pool = require('../db');

const router = express.Router();

// Ruta de Dashboard Técnico
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenido al Dashboard de Técnico' });
});

// Ruta para Registrar Cambios de Repuestos
router.post('/registro', authenticateToken, async (req, res) => {
  const { repuesto_id, descripcion, fecha } = req.body;

  if (!repuesto_id || !descripcion || !fecha) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    // Asumiendo que tienes una tabla llamada 'cambios_repuestos'
    const resultado = await pool.query(
      'INSERT INTO cambios_repuestos (repuesto_id, descripcion, fecha, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [repuesto_id, descripcion, fecha, req.user.id]
    );

    res.status(201).json({ message: 'Cambio registrado exitosamente.', cambio: resultado.rows[0] });
  } catch (error) {
    console.error('Error al registrar cambio:', error.message);
    res.status(500).json({ error: 'Error al registrar el cambio.' });
  }
});

// Ruta para Obtener Historial de Cambios
router.get('/historial', authenticateToken, async (req, res) => {
  try {
    const historial = await pool.query(
      'SELECT * FROM cambios_repuestos WHERE usuario_id = $1 ORDER BY fecha DESC',
      [req.user.id]
    );
    res.json({ historial: historial.rows });
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
});

// Ruta para Obtener Estadísticas
router.get('/estadisticas', authenticateToken, async (req, res) => {
  try {
    const totalCambios = await pool.query(
      'SELECT COUNT(*) FROM cambios_repuestos WHERE usuario_id = $1',
      [req.user.id]
    );
    const tiempoPromedio = await pool.query(
      'SELECT AVG(extract(epoch from (fecha - lag(fecha) OVER (ORDER BY fecha)))) AS tiempo_promedio FROM cambios_repuestos WHERE usuario_id = $1',
      [req.user.id]
    );

    res.json({
      totalCambios: totalCambios.rows[0].count,
      tiempoPromedio: tiempoPromedio.rows[0].tiempo_promedio,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error.message);
    res.status(500).json({ error: 'Error al obtener las estadísticas.' });
  }
});

// Nueva ruta para Calendario
router.get('/calendario', authenticateToken, async (req, res) => {
  try {
    // Obtener eventos del calendario (tareas programadas, mantenimientos, etc.)
    const eventos = await pool.query(
      `SELECT 
          tr.id,
          t.nombre_tarea,
          m.nombre as maquina,
          tr.fecha,
          mc.nombre_motivo as motivo
      FROM tareas_realizadas tr
      LEFT JOIN lista_de_tareas t ON tr.tarea_id = t.id
      LEFT JOIN maquinas m ON tr.maquina_id = m.id
      LEFT JOIN motivo_cambio mc ON tr.motivo_id = mc.id
      WHERE tr.usuario_id = $1
      ORDER BY tr.fecha DESC`,
      [req.user.id]
    );

    res.json({ 
      eventos: eventos.rows,
      message: 'Eventos del calendario obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error.message);
    res.status(500).json({ error: 'Error al obtener los eventos del calendario.' });
  }
});

// Ruta para agregar evento al Calendario
router.post('/calendario', authenticateToken, async (req, res) => {
  const { titulo, fecha, descripcion, tipo_evento } = req.body;

  if (!titulo || !fecha || !tipo_evento) {
    return res.status(400).json({ error: 'Título, fecha y tipo de evento son requeridos.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO eventos_calendario 
      (titulo, fecha, descripcion, tipo_evento, usuario_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [titulo, fecha, descripcion, tipo_evento, req.user.id]
    );

    res.status(201).json({
      message: 'Evento agregado exitosamente',
      evento: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar evento:', error.message);
    res.status(500).json({ error: 'Error al agregar el evento al calendario.' });
  }
});

// Ruta para Gestionar Inventario de Repuestos
router.get('/inventario', authenticateToken, async (req, res) => {
  try {
    const inventario = await pool.query('SELECT * FROM inventario_repuestos ORDER BY nombre');
    res.json({ inventario: inventario.rows });
  } catch (error) {
    console.error('Error al obtener inventario:', error.message);
    res.status(500).json({ error: 'Error al obtener el inventario.' });
  }
});

// Otras rutas específicas para Técnico...

module.exports = router;
