// Archivo: darkmode.js
document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    let darkMode = localStorage.getItem('darkMode') === 'enabled';

    function enableDarkMode() {
        document.body.classList.add('dark-mode');  // Añadir clase 'dark-mode'
        document.body.setAttribute('data-bs-theme', 'dark');  // Cambiar el atributo
        themeToggle.textContent = '☀️';  // Cambiar el icono a sol
        themeToggle.classList.replace('btn-light', 'btn-dark');
        localStorage.setItem('darkMode', 'enabled');
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');  // Quitar clase 'dark-mode'
        document.body.setAttribute('data-bs-theme', 'light');  // Cambiar el atributo
        themeToggle.textContent = '🌙';  // Cambiar el icono a luna
        themeToggle.classList.replace('btn-dark', 'btn-light');
        localStorage.setItem('darkMode', 'disabled');
    }

    if (darkMode) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    themeToggle.addEventListener('click', function () {
        darkMode = localStorage.getItem('darkMode') === 'enabled';
        if (darkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
});
