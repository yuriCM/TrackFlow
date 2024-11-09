document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Cargar datos iniciales
    cargarComponentesCriticos();
    cargarMetricas();

    // Manejar filtros de máquinas
    document.querySelectorAll('.machine-filters button').forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            document.querySelectorAll('.machine-filters button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            // Recargar datos con el filtro seleccionado
            const maquina = this.textContent === 'Todas' ? null : this.textContent;
            cargarComponentesCriticos(maquina);
            cargarMetricas(maquina);
        });
    });

    // Evento cerrar sesión
    document.getElementById('cerrarSesion').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});

async function cargarComponentesCriticos(maquina = null) {
    try {
        let url = '/api/estadisticas/componentes';
        if (maquina) {
            url += `?maquina=${maquina}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar componentes críticos');
        }

        const data = await response.json();
        actualizarTablaComponentes(data);
    } catch (error) {
        console.error('Error:', error);
        // Manejar el error apropiadamente
    }
}

function actualizarTablaComponentes(componentes) {
    const tbody = document.getElementById('componentesCriticos');
    tbody.innerHTML = '';

    componentes.forEach(comp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${comp.maquina}</td>
            <td>${comp.componente}</td>
            <td>${comp.instalacion}</td>
            <td>${comp.vidaUtil}</td>
            <td>${comp.tiempoRestante}</td>
            <td><span class="estado-${comp.estado.toLowerCase()}">${comp.estado}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

async function cargarMetricas(maquina = null) {
    try {
        let url = '/api/estadisticas/metricas';
        if (maquina) {
            url += `?maquina=${maquina}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar métricas');
        }

        const data = await response.json();
        actualizarMetricas(data);
    } catch (error) {
        console.error('Error:', error);
        // Manejar el error apropiadamente
    }
}

function actualizarMetricas(metricas) {
    // Actualizar cada métrica en su respectiva tarjeta
    document.querySelector('.metric-value:nth-child(1)').textContent = metricas.tareasCompletadas;
    document.querySelector('.metric-value:nth-child(2)').textContent = metricas.mantenimientosPendientes;
    document.querySelector('.metric-value:nth-child(3)').textContent = metricas.tiempoPromedio;
    document.querySelector('.metric-value:nth-child(4)').textContent = metricas.eficiencia;
} 