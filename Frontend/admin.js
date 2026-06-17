document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const errorMessage = document.getElementById('errorMessage');

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        errorMessage.style.display = 'none';
        adminLoginBtn.innerHTML = 'Authentification...';
        adminLoginBtn.disabled = true;

        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 🏆 SUCCÈS : On sauvegarde le Token Admin et on va sur le Dashboard !
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                // ❌ ERREUR (Mauvais mot de passe ou email)
                errorMessage.textContent = data.message;
                errorMessage.style.display = 'block';
                adminLoginBtn.innerHTML = 'Accéder au Dashboard';
                adminLoginBtn.disabled = false;
            }
        } catch (error) {
            errorMessage.textContent = 'Impossible de contacter le serveur sécurisé.';
            errorMessage.style.display = 'block';
            adminLoginBtn.innerHTML = 'Accéder au Dashboard';
            adminLoginBtn.disabled = false;
        }
    });
});