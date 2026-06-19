document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('membersTableBody');
    const token = localStorage.getItem('token');
    
    // Éléments de la modale
    const modal = document.getElementById('memberModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalName = document.getElementById('modalName');
    const modalBody = document.getElementById('modalBody');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('https://er-manager.onrender.com/api/admin/membres', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const membres = await response.json();
            tableBody.innerHTML = '';

            membres.forEach(membre => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td style="color: white;">${membre.nom_complet || '-'}</td>
                    <td>${membre.email || '-'}</td>
                    <td>${membre.telephone || '-'}</td>
                    <td>${membre.age || '-'}</td>
                    <td>${membre.sexe || '-'}</td>
                    <td><span class="badge">${membre.niveau_sportif || '-'}</span></td>
                    <td>${membre.profil_type || '-'}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${membre.objectifs_trimestre || '-'}
                    </td>
                    <td><span style="color: #4ade80;">${membre.statut || 'Actif'}</span></td>
                `;
                
                // On ajoute un écouteur de clic sur chaque ligne !
                tr.addEventListener('click', () => afficherDetailsMembre(membre));
                
                tableBody.appendChild(tr);
            });

        } else if (response.status === 403) {
            // ❌ LE SERVEUR DIT NON (Le membre n'est pas dans la liste VIP)
            alert("Accès restreint. Seule la direction Elite Runners peut consulter cette page.");
            window.location.href = 'register.html'; 
            
        } else {
            // ❌ LE TOKEN EST INVALIDE (Pas connecté ou expiré)
            alert("Accès refusé. Veuillez vous reconnecter.");
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #ff6b6b;">Erreur de connexion au serveur.</td></tr>`;
    }

    // ==========================================
    // LOGIQUE DE LA MODALE
    // ==========================================
    function afficherDetailsMembre(membre) {
        // On met le nom en titre
        modalName.textContent = `Dossier de ${membre.nom_complet || 'Membre'}`;
        
        // On construit le HTML avec les données détaillées (y compris les nouvelles colonnes)
        modalBody.innerHTML = `
            <div class="detail-group">
                <strong>Objectifs du trimestre</strong>
                <p>${membre.objectifs_trimestre || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Première fois chez ER ?</strong>
                <p>${membre.premiere_fois || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Affiliation à une salle</strong>
                <p>${membre.affiliation_salle || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Activités physiques pratiquées</strong>
                <p>${membre.activites_pratiquees || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Loisirs et Intérêts sportifs</strong>
                <p>${membre.loisirs_interets || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Activités prévues ce printemps/été</strong>
                <p>${membre.activites_ete_er || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Limites actuelles</strong>
                <p>${membre.limites_actuelles || 'Non spécifié'}</p>
            </div>
            <div class="detail-group">
                <strong>Comment comptez-vous vaincre ces limites ?</strong>
                <p>${membre.vaincre_limites || 'Non spécifié'}</p>
            </div>
            <div style="font-size: 0.8rem; color: var(--first-color); margin-top: 2rem; text-align: center;">
                Dossier mis à jour le : ${new Date(membre.date_mise_a_jour).toLocaleString('fr-CA')}
            </div>
        `;

        // On affiche la modale (on passe de 'none' à 'flex')
        modal.style.display = 'flex';
    }

    // Fermer la modale en cliquant sur la croix
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fermer la modale en cliquant en dehors de la boîte
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});