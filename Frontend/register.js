document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');

    // =========================================================
    // 1. IMPORTATION AUTOMATIQUE (Pré-remplissage Magique)
    // =========================================================
    try {
        const token = localStorage.getItem('token');
        
        // Redirection si l'utilisateur n'est pas connecté
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // On interroge le serveur
        const response = await fetch('https://er-manager-api.onrender.com/api/profil/import', {
    headers: { 'Authorization': `Bearer ${token}` }
});

        if (response.ok) {
            const result = await response.json();
            const data = result.data;

            if (data) {
                // --- A. Remplissage des champs textes classiques ---
                const setVal = (id, val) => {
                    if (val && document.getElementById(id)) {
                        document.getElementById(id).value = val;
                    }
                };

                setVal('fullName', data.fullName);
                setVal('email', data.email);
                setVal('age', data.age);
                setVal('dob', data.dob);
                setVal('phone', data.phone);
                
                // Nouveaux champs spécifiques à ton HTML
                setVal('firstTime', data.premiereFois);
                setVal('gymAffiliation', data.affiliation);
                setVal('activitiesPratice', data.activitesPratiquees);
                setVal('activitiesInterest', data.loisirs);
                setVal('springActivities', data.activitesER);
                setVal('goals', data.goals);
                setVal('limits', data.limites);
                setVal('strengths', data.vaincreLimites);

                // --- B. Fonction magique pour les boutons ronds (Radio) ---
                const cocherBouton = (nomGroupe, valeurTrouvee) => {
                    if (!valeurTrouvee) return;
                    const boutons = document.getElementsByName(nomGroupe);
                    for (let btn of boutons) {
                        const valBtn = btn.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const valGoogle = valeurTrouvee.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        if (valBtn === valGoogle) {
                            btn.checked = true;
                            break;
                        }
                    }
                };

                cocherBouton('sexe', data.sexe);
                cocherBouton('niveau', data.niveau);
                cocherBouton('profil', data.profil);

                // --- C. Remplissage des cases à cocher (Engagements) ---
                // Ton HTML n'a pas d'ID pour ces cases, on les sélectionne par leur position (0, 1 et 2)
                const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                
                const verifierOui = (valeur) => {
                    if (!valeur) return false;
                    return valeur.trim().toLowerCase() === 'oui';
                };

                if (checkboxes.length >= 3) {
                    if (verifierOui(data.engagementActif)) checkboxes[0].checked = true;
                    if (verifierOui(data.engagementObjectifs)) checkboxes[1].checked = true;
                    if (verifierOui(data.acceptationRetrait)) checkboxes[2].checked = true;
                }

                console.log("Données importées avec succès !");
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'importation :", error);
    }

    // =========================================================
    // 2. SOUMISSION DU FORMULAIRE SÉCURISÉ
    // =========================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Animation du bouton pendant le chargement
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enregistrement...';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'wait';
        submitBtn.disabled = true;

        // On rassemble toutes les données tapées par l'utilisateur
        const formData = {
            fullName: document.getElementById('fullName').value,
            sexe: document.querySelector('input[name="sexe"]:checked')?.value || '',
            age: document.getElementById('age').value,
            dob: document.getElementById('dob').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            
            // Les nouveaux champs
            firstTime: document.getElementById('firstTime').value,
            gymAffiliation: document.getElementById('gymAffiliation').value,
            niveau: document.querySelector('input[name="niveau"]:checked')?.value || '',
            activitiesPratice: document.getElementById('activitiesPratice').value,
            activitiesInterest: document.getElementById('activitiesInterest').value,
            springActivities: document.getElementById('springActivities').value,
            goals: document.getElementById('goals').value,
            limits: document.getElementById('limits').value,
            strengths: document.getElementById('strengths').value,
            profil: document.querySelector('input[name="profil"]:checked')?.value || ''
        };

        try {
            const token = localStorage.getItem('token');

            // Envoi au Backend
            const response = await fetch('https://er-manager-api.onrender.com/api/profil/confirmation', {
            method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = 'success.html';
            } else {
                alert('Erreur: ' + result.message);
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            alert('Impossible de contacter le serveur.');
        } finally {
            // Restauration du bouton
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.disabled = false;
        }
    });
});