// Adresse unique du serveur Node.js (Render), utilisée par tous les scripts du frontend
const API_URL = 'https://er-manager.onrender.com';

// Échappe le HTML pour empêcher l'injection de code (XSS) via les données des membres
function escapeHtml(valeur) {
    return String(valeur ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
