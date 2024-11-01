document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay un usuario autenticado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Manejar el cierre de sesión
    document.getElementById('cerrarSesion').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Resto del código para manejar el formulario y cargar las opciones
    // ... (el mismo código que estaba en dashboard.js)
}); 