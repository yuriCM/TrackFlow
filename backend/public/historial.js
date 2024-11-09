let currentPage = 1;
let currentMaquina = null;

async function cargarHistorial(page = 1, maquina = null) {
    try {
        let url = `/api/historial?page=${page}`;
        if (maquina) {
            url += `&maquina=${maquina}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el historial');
        }

        const data = await response.json();
        actualizarTabla(data.tareas);
        actualizarPaginacion(data.currentPage, data.totalPages);
        actualizarBotonesFiltro(data.maquinaActual);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el historial');
    }
}

function actualizarTabla(tareas) {
    const tabla = document.getElementById('historialTabla');
    tabla.innerHTML = '';

    if (tareas.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="5" class="text-center">No hay tareas para mostrar</td>';
        tabla.appendChild(fila);
        return;
    }

    tareas.forEach(registro => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${registro.nombre_tarea}</td>
            <td>${registro.maquina}</td>
            <td>${registro.fecha}</td>
            <td><span class="motivo-badge ${getMotivoBadgeClass(registro.motivo)}">${registro.motivo}</span></td>
            <td>${registro.realizado_por}</td>
        `;
        tabla.appendChild(fila);
    });
}

function actualizarBotonesFiltro(maquinaActual) {
    document.querySelectorAll('.machine-filters .btn').forEach(btn => {
        const maquina = btn.textContent;
        btn.classList.toggle('active', maquina === maquinaActual);
    });
}

// Inicializar eventos de filtro
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.machine-filters .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const maquina = btn.textContent;
            currentMaquina = currentMaquina === maquina ? null : maquina;
            currentPage = 1; // Reset a primera página
            cargarHistorial(currentPage, currentMaquina);
        });
    });

    cargarHistorial(1);
});

function actualizarPaginacion(currentPage, totalPages) {
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';

    // Botón anterior
    const prevBtn = document.createElement('li');
    prevBtn.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = `<a class="page-link" href="#" ${currentPage === 1 ? 'tabindex="-1"' : ''}>Anterior</a>`;
    prevBtn.onclick = () => currentPage > 1 && cargarHistorial(currentPage - 1);
    paginacion.appendChild(prevBtn);

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.onclick = () => cargarHistorial(i);
        paginacion.appendChild(pageItem);
    }

    // Botón siguiente
    const nextBtn = document.createElement('li');
    nextBtn.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'tabindex="-1"' : ''}>Siguiente</a>`;
    nextBtn.onclick = () => currentPage < totalPages && cargarHistorial(currentPage + 1);
    paginacion.appendChild(nextBtn);
}

function getMotivoBadgeClass(motivo) {
    switch (motivo.toLowerCase()) {
        case 'correctivo':
            return 'motivo-correctivo';
        case 'predictivo':
            return 'motivo-predictivo';
        case 'preventivo':
            return 'motivo-preventivo';
        default:
            return 'motivo-otro';
    }
} 