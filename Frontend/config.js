// Adresse unique du serveur Node.js (Render), utilisée par tous les scripts du frontend
// En local (http://localhost:3000), le serveur Node sert aussi le frontend : on reste sur la même adresse
const API_URL = location.hostname === 'localhost' ? '' : 'https://er-manager.onrender.com';

// Échappe le HTML pour empêcher l'injection de code (XSS) via les données des membres
function escapeHtml(valeur) {
    return String(valeur ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
