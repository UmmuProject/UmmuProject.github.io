function validateLogin(event) {
    event.preventDefault(); // Mencegah form dari submit secara default

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Periksa username dan password
    if (username === 'Mitra Bisnis Pemasaran' && password === 'MBP#2024') {
        // Jika valid, alihkan ke index.html
        window.location.href = 'index.html';
    } else {
        // Jika tidak valid, tampilkan pesan kesalahan
        errorMessage.textContent = 'Username atau Password salah!';
    }
}

function togglePassword() {
    const passwordField = document.getElementById('password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}
