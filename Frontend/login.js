document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage'); // NOUVEAU : On cible la boîte d'erreur

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // On cache l'erreur au début d'une nouvelle tentative
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        const email = document.getElementById('loginEmail').value;
        const phone = document.getElementById('loginPhone').value; 

        // Animation du bouton
        loginBtn.innerHTML = 'Vérification...';
        loginBtn.disabled = true;

        try {
            // On appelle la route de login de notre serveur Node.js
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, phone: phone }) 
            });

            const data = await response.json();

            if (response.ok) {
                // 🏆 SUCCÈS : Le serveur nous a donné le Token !
                localStorage.setItem('token', data.token);
                
                // On redirige l'utilisateur vers le grand formulaire
                window.location.href = 'register.html';
            } else {
                // ❌ ÉCHEC : On affiche l'erreur dans la boîte au lieu d'un alert()
                errorMessage.textContent = data.message;
                errorMessage.style.display = 'block';
                
                // On remet le bouton à la normale
                loginBtn.innerHTML = 'Se connecter';
                loginBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erreur:', error);
            
            // ❌ ERREUR RÉSEAU : On l'affiche aussi proprement
            errorMessage.textContent = 'Impossible de contacter le serveur.';
            errorMessage.style.display = 'block';
            
            // On remet le bouton à la normale
            loginBtn.innerHTML = 'Se connecter';
            loginBtn.disabled = false;
        }
    });
});