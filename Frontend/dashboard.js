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

    // Déconnexion : on supprime le token avant de quitter la page
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
    });

    try {
        const response = await fetch(`${API_URL}/api/admin/membres`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const membres = await response.json();
            tableBody.innerHTML = '';

            membres.forEach(membre => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td data-label="Nom" style="color: white;">${escapeHtml(membre.nom_complet || '-')}</td>
                    <td data-label="Email">${escapeHtml(membre.email || '-')}</td>
                    <td data-label="Téléphone">${escapeHtml(membre.telephone || '-')}</td>
                    <td data-label="Âge">${escapeHtml(membre.age || '-')}</td>
                    <td data-label="Sexe">${escapeHtml(membre.sexe || '-')}</td>
                    <td data-label="Niveau"><span class="badge">${escapeHtml(membre.niveau_sportif || '-')}</span></td>
                    <td data-label="Profil">${escapeHtml(membre.profil_type || '-')}</td>
                    <td data-label="Objectifs" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${escapeHtml(membre.objectifs_trimestre || '-')}
                    </td>
                    <td data-label="Statut"><span style="color: #4ade80;">${escapeHtml(membre.statut || 'Actif')}</span></td>
                    <td>
                        <button class="dossier-btn">Dossier complet</button>
                        <button class="delete-btn" style="background: none; border: 1px solid #ff6b6b; color: #ff6b6b; border-radius: 0.5rem; padding: 0.3rem 0.7rem; cursor: pointer;">Supprimer</button>
                    </td>
                `;

                // On ajoute un écouteur de clic sur chaque ligne !
                // Sur mobile : un toucher déplie/replie la carte ; sur ordinateur : ouvre le dossier
                tr.addEventListener('click', () => {
                    if (matchMedia('(max-width: 768px)').matches) tr.classList.toggle('open');
                    else afficherDetailsMembre(membre);
                });

                tr.querySelector('.dossier-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    afficherDetailsMembre(membre);
                });

                // Suppression (sans ouvrir la modale de la ligne)
                tr.querySelector('.delete-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Supprimer définitivement ${membre.nom_complet || membre.email} ?`)) return;

                    const res = await fetch(`${API_URL}/api/admin/membres/${encodeURIComponent(membre.email)}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) tr.remove();
                    else alert('Erreur : ' + (await res.json()).message);
                });
                
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
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #ff6b6b;">Erreur de connexion au serveur.</td></tr>`;
    }

    // ==========================================
    // AJOUT D'UN MEMBRE
    // ==========================================
    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/api/admin/membres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                fullName: document.getElementById('newName').value,
                email: document.getElementById('newEmail').value,
                phone: document.getElementById('newPhone').value
            })
        });
        if (res.ok) location.reload();
        else alert('Erreur : ' + (await res.json()).message);
    });

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
                <p>${escapeHtml(membre.objectifs_trimestre || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Première fois chez ER ?</strong>
                <p>${escapeHtml(membre.premiere_fois || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Affiliation à une salle</strong>
                <p>${escapeHtml(membre.affiliation_salle || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Activités physiques pratiquées</strong>
                <p>${escapeHtml(membre.activites_pratiquees || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Loisirs et Intérêts sportifs</strong>
                <p>${escapeHtml(membre.loisirs_interets || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Activités prévues ce printemps/été</strong>
                <p>${escapeHtml(membre.activites_ete_er || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Limites actuelles</strong>
                <p>${escapeHtml(membre.limites_actuelles || 'Non spécifié')}</p>
            </div>
            <div class="detail-group">
                <strong>Comment comptez-vous vaincre ces limites ?</strong>
                <p>${escapeHtml(membre.vaincre_limites || 'Non spécifié')}</p>
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