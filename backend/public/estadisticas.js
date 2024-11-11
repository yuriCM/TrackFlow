document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada, iniciando carga de datos');
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

async function cargarComponentesCriticos(maquina = null, page = 1) {
    try {
        let url = `/api/estadisticas/componentes?page=${page}`;
        if (maquina) {
            url += `&maquina=${maquina}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar componentes críticos');
        }

        const { data, pagination } = await response.json();
        actualizarTablaComponentes(data);
        actualizarPaginacion(pagination);
    } catch (error) {
        console.error('Error:', error);
    }
}

function actualizarTablaComponentes(componentes) {
    const tbody = document.getElementById('componentesCriticos');
    const alertaMantenimiento = document.getElementById('alertaMantenimiento');
    tbody.innerHTML = '';

    if (!componentes || componentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay datos disponibles</td></tr>';
        // Ocultar alerta si no hay datos
        alertaMantenimiento.style.display = 'none';
        return;
    }

    // Verificar si hay algún componente en estado de advertencia
    const hayAdvertencias = componentes.some(comp => comp.estado === 'Advertencia');
    
    // Mostrar u ocultar la alerta según corresponda
    alertaMantenimiento.style.display = hayAdvertencias ? 'block' : 'none';

    componentes.forEach(comp => {
        const fecha = new Date(comp.instalacion).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${comp.maquina || 'N/A'}</td>
            <td>${comp.componente || 'N/A'}</td>
            <td class="text-center">${fecha}</td>
            <td class="text-center">${comp.vidaUtil || '12 meses'}</td>
            <td class="text-center">${comp.tiempoRestante || 'Por calcular'}</td>
            <td class="text-center"><span class="estado-${comp.estado.toLowerCase()}">${comp.estado}</span></td>
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

function actualizarPaginacion(pagination) {
    const paginationContainer = document.getElementById('pagination');
    let html = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';
    
    // Botón Previous
    html += `
        <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Anterior</a>
        </li>
    `;

    // Números de página
    for (let i = 1; i <= pagination.totalPages; i++) {
        html += `
            <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Botón Next
    html += `
        <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Siguiente</a>
        </li>
    `;

    html += '</ul></nav>';
    paginationContainer.innerHTML = html;

    // Agregar event listeners a los botones de paginación
    document.querySelectorAll('.pagination .page-link').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const newPage = parseInt(this.dataset.page);
            const maquina = document.querySelector('.machine-filters .active')?.textContent;
            if (maquina === 'Todas') {
                cargarComponentesCriticos(null, newPage);
            } else {
                cargarComponentesCriticos(maquina, newPage);
            }
        });
    });
} 