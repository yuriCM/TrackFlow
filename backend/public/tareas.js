document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Verificación del token
    fetch('/api/verify-token', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        return response.json();
    })
    .catch(error => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Evento cerrar sesión
    document.getElementById('cerrarSesion').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Cargar máquinas inmediatamente
    cargarMaquinas();

    // Agregar evento para cuando cambie la selección de máquina
    document.getElementById('maquina').addEventListener('change', cargarTareasParaMaquina);

    // Manejar la visibilidad del segundo formulario
    const toggleButton = document.getElementById('toggleForm');
    const secondForm = document.getElementById('secondForm');
    const formsContainer = document.querySelector('.forms-container');
    let isSecondFormVisible = false;

    // Agregar clase inicial para centrado
    formsContainer.classList.add('single-form');

    toggleButton.addEventListener('click', function() {
        isSecondFormVisible = !isSecondFormVisible;
        
        if (isSecondFormVisible) {
            // Mostrar segundo formulario
            secondForm.style.display = 'block';
            formsContainer.classList.remove('single-form');
            // Dar tiempo para la transición
            setTimeout(() => {
                secondForm.classList.add('show');
            }, 10);
        } else {
            // Ocultar segundo formulario
            secondForm.classList.remove('show');
            formsContainer.classList.add('single-form');
            // Esperar a que termine la animación
            setTimeout(() => {
                secondForm.style.display = 'none';
            }, 300);
        }
        
        // Cambiar el ícono
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-plus-circle-fill');
        icon.classList.toggle('bi-dash-circle-fill');
    });

    // Cargar máquinas en el segundo formulario también
    const selectMaquinaNuevaTarea = document.getElementById('maquinaNuevaTarea');
    if (selectMaquinaNuevaTarea) {
        cargarMaquinasEnSelect(selectMaquinaNuevaTarea);
    }

    // Función para cargar los motivos
    async function cargarMotivos() {
        try {
            const response = await fetch('/api/motivos', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar motivos');
            }

            const motivos = await response.json();
            const selectMotivo = document.getElementById('motivo');
            
            // Limpiar y agregar opción por defecto
            selectMotivo.innerHTML = '<option value="" disabled selected>Seleccione</option>';
            
            // Agregar los motivos
            motivos.forEach(motivo => {
                const option = document.createElement('option');
                option.value = motivo.id;
                option.textContent = motivo.nombre_motivo;
                selectMotivo.appendChild(option);
            });

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los motivos');
        }
    }

    // Cargar los motivos al iniciar la página
    cargarMotivos();
});

// Función para cargar las máquinas desde la base de datos
async function cargarMaquinas() {
    try {
        const response = await fetch('/api/maquinas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar máquinas');
        }

        const maquinas = await response.json();
        const selectMaquina = document.getElementById('maquina');
        
        // Simplificar el texto a solo "Seleccione"
        selectMaquina.innerHTML = '<option value="" disabled selected>Seleccione</option>';
        
        // Agregar las máquinas ordenadas
        maquinas.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina.id;
            option.textContent = maquina.nombre;
            selectMaquina.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar máquinas:', error);
        mostrarError('Error al cargar las máquinas');
    }
}

// Función auxiliar para mostrar errores
function mostrarError(mensaje) {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.textContent = mensaje;
    errorAlert.classList.remove('d-none');
    setTimeout(() => {
        errorAlert.classList.add('d-none');
    }, 3000);
}

// Función para cargar tareas según la máquina seleccionada
async function cargarTareasParaMaquina() {
    try {
        const maquinaId = document.getElementById('maquina').value;
        if (!maquinaId) return; // Si no hay máquina seleccionada, no hacer nada

        const response = await fetch(`/api/tareas/${maquinaId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar tareas');
        }

        const tareas = await response.json();
        const selectTareas = document.getElementById('listaTareas');
        
        // Limpiar y agregar opción por defecto
        selectTareas.innerHTML = '<option value="" disabled selected>Seleccione</option>';
        
        // Agregar las tareas
        tareas.forEach(tarea => {
            const option = document.createElement('option');
            option.value = tarea.id;
            option.textContent = tarea.nombre_tarea;
            selectTareas.appendChild(option);
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar las tareas');
    }
}

// Función para limpiar el formulario
function limpiarFormularioNuevaTarea() {
    document.getElementById('maquinaNuevaTarea').value = '';
    document.getElementById('nombreNuevaTarea').value = '';
}

// Función para cargar máquinas en cualquier select
async function cargarMaquinasEnSelect(selectElement) {
    try {
        const response = await fetch('/api/maquinas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar máquinas');
        }

        const maquinas = await response.json();
        
        // Limpiar y agregar opción por defecto
        selectElement.innerHTML = '<option value="" disabled selected>Seleccione</option>';
        
        // Agregar las máquinas
        maquinas.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina.id;
            option.textContent = maquina.nombre;
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar las máquinas');
    }
} 