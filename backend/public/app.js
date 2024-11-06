document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del DOM
    const loginCard = document.getElementById('loginForm')?.parentElement?.parentElement;
    const registroCard = document.getElementById('registro-form');
    const showRegistroLink = document.getElementById('show-registro');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');

    // Toggle entre formularios
    if (showRegistroLink && showLoginLink) {
        showRegistroLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'none';
            registroCard.style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'block';
            registroCard.style.display = 'none';
        });
    }

    // Toggle password visibility
    const togglePasswords = document.querySelectorAll('.toggle-password');
    togglePasswords.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    });

    // Funciones de validación
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    // Configurar formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                // Mostrar overlay de transición
                const overlay = document.createElement('div');
                overlay.className = 'transition-overlay';
                overlay.innerHTML = '<span class="loader"></span>';
                document.body.appendChild(overlay);
                overlay.style.display = 'flex';

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error en el login');
                }

                // Guardar datos
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Animación de salida
                document.body.classList.add('fade-out');
                
                // Redirección con delay para la animación
                setTimeout(() => {
                    window.location.href = '/tareas.html';
                }, 300);

            } catch (error) {
                console.error('Error:', error);
                // Remover overlay
                overlay.remove();
                
                // Mostrar error
                const errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-danger fade-in';
                errorAlert.textContent = 'Error en el login: ' + error.message;
                loginForm.insertBefore(errorAlert, loginForm.firstChild);
                
                setTimeout(() => {
                    errorAlert.remove();
                }, 3000);
            }
        });
    }

    // Configurar formulario de registro
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario de registro enviado');

            try {
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirmPassword').value;

                // Validaciones
                if (!validateEmail(email)) {
                    throw new Error('Email inválido');
                }

                if (!validatePassword(password)) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }

                if (password !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }

                const formData = { name, email, password };
                console.log('Datos a enviar:', formData);

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('Respuesta status:', response.status);
                
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error al registrar usuario');
                }

                console.log('Registro exitoso:', data);
                alert('Usuario registrado exitosamente');
                
                // Mostrar el formulario de login
                loginCard.style.display = 'block';
                registroCard.style.display = 'none';
                registroForm.reset();

            } catch (error) {
                console.error('Error completo:', error);
                alert('Error en el registro: ' + error.message);
            }
        });
    }
});
