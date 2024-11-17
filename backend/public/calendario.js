document.addEventListener('DOMContentLoaded', function() {
    const calendarBody = document.getElementById('calendarBody');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('today');
    const addMaintenanceBtn = document.getElementById('addMaintenanceBtn');
    
    let currentDate = new Date();
    
    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Actualizar título del mes
        const monthName = new Intl.DateTimeFormat('es', { month: 'long' }).format(currentDate);
        currentMonthElement.textContent = `${monthName} de ${year}`;
        
        // Obtener el primer día del mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Limpiar calendario
        calendarBody.innerHTML = '';
        
        let date = new Date(firstDay);
        date.setDate(date.getDate() - date.getDay());
        
        while (date <= lastDay || date.getDay() !== 0) {
            const row = document.createElement('tr');
            
            for (let i = 0; i < 7; i++) {
                const cell = document.createElement('td');
                const dateNumber = document.createElement('div');
                dateNumber.textContent = date.getDate();
                
                if (date.getMonth() !== month) {
                    cell.classList.add('other-month');
                }
                
                if (isToday(date)) {
                    cell.classList.add('today');
                }
                
                cell.appendChild(dateNumber);
                row.appendChild(cell);
                
                date.setDate(date.getDate() + 1);
            }
            
            calendarBody.appendChild(row);
        }
    }
    
    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        updateCalendar();
    });
    
    // Inicializar calendario
    updateCalendar();
    
    // Bootstrap Modal
    const maintenanceModal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
    
    addMaintenanceBtn.addEventListener('click', () => {
        maintenanceModal.show();
    });
}); 