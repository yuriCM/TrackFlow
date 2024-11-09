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

    // Agregar el event listener para el formulario
    document.getElementById('registroTareasForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const maquina_id = document.getElementById('maquina').value;
        const tarea_id = document.getElementById('listaTareas').value;
        const motivo_id = document.getElementById('motivo').value;
        const fecha = document.getElementById('fecha').value;

        // Validar que todos los campos estén completos
        if (!maquina_id || !tarea_id || !motivo_id || !fecha) {
            mostrarError('Por favor complete todos los campos');
            return;
        }

        try {
            const response = await fetch('/api/tareas-realizadas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    maquina_id,
                    tarea_id,
                    motivo_id,
                    fecha
                })
            });

            if (!response.ok) {
                throw new Error('Error al registrar la tarea');
            }

            const data = await response.json();
            
            // Mostrar mensaje de éxito
            mostrarExito('Tarea registrada exitosamente');
            
            // Limpiar el formulario
            this.reset();
            
            // Opcional: Recargar los selects
            cargarMaquinas();
            document.getElementById('listaTareas').innerHTML = '<option value="">Seleccione una tarea</option>';
            document.getElementById('motivo').value = '';

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al registrar la tarea');
        }
    });

    // Agregar función para mostrar mensajes de éxito
    function mostrarExito(mensaje) {
        const successAlert = document.getElementById('successAlert');
        successAlert.textContent = mensaje;
        successAlert.classList.remove('d-none');
        setTimeout(() => {
            successAlert.classList.add('d-none');
        }, 3000);
    }

    // Agregar el event listener para el formulario de nueva tarea
    document.getElementById('formularioAdicional').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const maquina_id = document.getElementById('maquinaNuevaTarea').value;
        const nombre_tarea = document.getElementById('nombreNuevaTarea').value;

        // Validar campos
        if (!maquina_id || !nombre_tarea) {
            mostrarError('Por favor complete todos los campos');
            return;
        }

        try {
            const response = await fetch('/api/nueva-tarea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    maquina_id,
                    nombre_tarea
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear la tarea');
            }

            const data = await response.json();
            
            // Mostrar mensaje de éxito
            mostrarExito('Tarea creada exitosamente');
            
            // Limpiar el formulario
            limpiarFormularioNuevaTarea();
            
            // Opcional: Si la máquina seleccionada en el primer formulario es la misma,
            // actualizar la lista de tareas
            const maquinaSeleccionada = document.getElementById('maquina').value;
            if (maquinaSeleccionada === maquina_id) {
                await cargarTareasParaMaquina();
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al crear la tarea');
        }
    });

    // Actualizar la función limpiarFormularioNuevaTarea
    function limpiarFormularioNuevaTarea() {
        document.getElementById('maquinaNuevaTarea').value = '';
        document.getElementById('nombreNuevaTarea').value = '';
    }

    // Función para cargar las últimas tareas cuando se selecciona una máquina
    async function cargarUltimasTareas() {
        try {
            const maquinaId = document.getElementById('maquinaNuevaTarea').value;
            if (!maquinaId) return;

            const response = await fetch(`/api/ultimas-tareas/${maquinaId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar últimas tareas');
            }

            const tareas = await response.json();
            const datalist = document.getElementById('ultimasTareas');
            datalist.innerHTML = ''; // Limpiar lista actual

            // Agregar las últimas tareas al datalist
            tareas.forEach(tarea => {
                const option = document.createElement('option');
                option.value = tarea.nombre_tarea;
                datalist.appendChild(option);
            });

        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Agregar el evento para cargar las últimas tareas cuando se selecciona una máquina
    document.getElementById('maquinaNuevaTarea').addEventListener('change', cargarUltimasTareas);
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
        if (!maquinaId) return;

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
        selectTareas.innerHTML = '<option value="">Seleccione una tarea</option>';
        
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

// Mover esta función fuera del DOMContentLoaded
async function eliminarTarea() {
    try {
        // Obtener valores del formulario de nueva tarea
        const maquinaId = document.getElementById('maquinaNuevaTarea').value;
        const nombreTarea = document.getElementById('nombreNuevaTarea').value.trim();

        // Validar campos
        if (!maquinaId || !nombreTarea) {
            alert('Por favor seleccione una máquina y escriba el nombre de la tarea');
            return;
        }

        // Confirmar eliminación
        if (!confirm('¿Está seguro de que desea eliminar esta tarea?')) {
            return;
        }

        // Realizar la eliminación
        const response = await fetch('/api/tareas/eliminar', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                maquina_id: maquinaId,
                nombre_tarea: nombreTarea
            })
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la tarea');
        }

        alert('Tarea eliminada exitosamente');
        
        // Limpiar el formulario
        document.getElementById('maquinaNuevaTarea').value = '';
        document.getElementById('nombreNuevaTarea').value = '';

        // Actualizar la lista de tareas
        const maquinaSeleccionada = document.getElementById('maquina').value;
        if (maquinaSeleccionada === maquinaId) {
            await cargarTareasParaMaquina();
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la tarea');
    }
} 