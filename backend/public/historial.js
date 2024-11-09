let currentPage = 1;
let currentMaquina = null;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Cargar historial inicial
    cargarHistorial(1);

    // Configurar eventos de filtros de máquinas
    document.querySelectorAll('.machine-filters button').forEach(button => {
        button.addEventListener('click', () => {
            const maquina = button.dataset.maquina;
            document.querySelectorAll('.machine-filters button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (currentMaquina === maquina) {
                currentMaquina = null;
                button.classList.remove('active');
            } else {
                currentMaquina = maquina;
                button.classList.add('active');
            }
            
            currentPage = 1;
            cargarHistorial(currentPage);
        });
    });

    // Configurar evento de cerrar sesión
    document.getElementById('cerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});

async function cargarHistorial(page = 1) {
    try {
        console.log('Intentando cargar historial...'); // Debug
        const response = await fetch(`/api/historial?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el historial');
        }

        const data = await response.json();
        console.log('Datos recibidos:', data); // Debug
        actualizarTabla(data.tareas);
        actualizarPaginacion(data.currentPage, data.totalPages);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el historial: ' + error.message);
    }
}

function actualizarTabla(tareas) {
    const tabla = document.getElementById('historialTabla');
    tabla.innerHTML = '';

    if (tareas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay registros para mostrar</td>
            </tr>
        `;
        return;
    }

    tareas.forEach(tarea => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${tarea.tarea_id}</td>
            <td>${tarea.maquina_id}</td>
            <td>${formatearFecha(tarea.fecha)}</td>
            <td>${tarea.motivo_id}</td>
            <td>${tarea.usuario_id}</td>
        `;
        tabla.appendChild(fila);
    });
}

function actualizarPaginacion(currentPage, totalPages) {
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';

    // Botón Anterior
    const prevBtn = document.createElement('li');
    prevBtn.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = `
        <button class="page-link" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
    `;
    if (currentPage > 1) {
        prevBtn.onclick = () => cargarHistorial(currentPage - 1);
    }
    paginacion.appendChild(prevBtn);

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link">${i}</button>`;
        pageItem.onclick = () => cargarHistorial(i);
        paginacion.appendChild(pageItem);
    }

    // Botón Siguiente
    const nextBtn = document.createElement('li');
    nextBtn.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = `
        <button class="page-link" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
    `;
    if (currentPage < totalPages) {
        nextBtn.onclick = () => cargarHistorial(currentPage + 1);
    }
    paginacion.appendChild(nextBtn);
}

function formatearFecha(fecha) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleString('es-ES', options);
}

function getBadgeClass(motivo) {
    const motivoLower = motivo?.toLowerCase() || '';
    if (motivoLower.includes('correctivo')) return 'bg-danger';
    if (motivoLower.includes('preventivo')) return 'bg-success';
    if (motivoLower.includes('predictivo')) return 'bg-warning';
    return 'bg-secondary';
} 


// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
    // Evento para cerrar sesión
    document.getElementById('cerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Eventos para los botones de filtro
    document.querySelectorAll('.machine-filters .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const maquina = btn.textContent;
            currentMaquina = currentMaquina === maquina ? null : maquina;
            currentPage = 1; // Reset a primera página
            cargarHistorial(currentPage, currentMaquina);
        });
    });

    // Cargar historial inicial
    cargarHistorial(1);
}); 