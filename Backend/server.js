require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const path = require('path');
const sql = require('mssql'); // <-- NOUVEAU : On importe le bon outil SQL

const app = express();

// Le secret JWT est obligatoire : sans lui, n'importe qui pourrait forger un token admin
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERREUR : la variable d'environnement JWT_SECRET n'est pas définie.");
    process.exit(1);
}

// ==========================================
// CONFIGURATION CORS (Sécurité pour Netlify)
// ==========================================
app.use(cors({
    origin: 'https://elite-runners-portail.netlify.app', // L'adresse exacte de ton frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Actions autorisées
    allowedHeaders: ['Content-Type', 'Authorization'] // En-têtes autorisés (pour le Token)
}));

app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../Frontend')));

// ==========================================
// CONFIGURATION DE LA BASE DE DONNÉES (MSSQL)
// ==========================================

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Requis par les serveurs cloud
        trustServerCertificate: true // 👇 LA LIGNE MAGIQUE POUR SOMEE 👇
    }
};

// ==========================================
// CONFIGURATION GOOGLE FORMS API
// ==========================================
const FORM_ID = '1vIi8ZGGpu7q-Pcs8JXJ2qlGvE8Sgh-t6KKU8uELgxKs'; 

async function getMemberFromForm(searchEmail) {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: [
            'https://www.googleapis.com/auth/forms.responses.readonly',
            'https://www.googleapis.com/auth/forms.body.readonly' 
        ],
    });
    const client = await auth.getClient();
    const forms = google.forms({ version: 'v1', auth: client });

    try {
        const formStructure = await forms.forms.get({ formId: FORM_ID });
        const questionMap = {}; 
        
        formStructure.data.items.forEach(item => {
            if (item.questionItem && item.questionItem.question) {
                questionMap[item.questionItem.question.questionId] = item.title.toLowerCase();
            }
        });

        const res = await forms.forms.responses.list({ formId: FORM_ID });
        const responses = res.data.responses;

        if (!responses) return null;

        for (const response of responses) {
            let memberData = { 
                email: '', phone: '', fullName: '', age: '', sexe: '', niveau: '', goals: '', dob: '', profil: '',
                premiereFois: '', affiliation: '', activitesPratiquees: '', loisirs: '', 
                activitesER: '', limites: '', vaincreLimites: '', 
                engagementActif: '', engagementObjectifs: '', acceptationRetrait: '' 
            };
            
            if (response.respondentEmail) memberData.email = response.respondentEmail;

            if (response.answers) {
                for (const [questionId, answerObj] of Object.entries(response.answers)) {
                    const title = questionMap[questionId] || "";
                    const value = answerObj.textAnswers?.answers[0]?.value || "";

                    if (title.includes('e-mail') || title.includes('email') || title.includes('courriel')) memberData.email = value;
                    if (title.includes('téléphone') || title.includes('cellulaire') || title.includes('phone') || title.includes('numéro')) memberData.phone = value;
                    if (title.includes('nom') || title.includes('complet')) memberData.fullName = value;
                    if (title === 'âge' || title === 'age' || title === 'votre âge') memberData.age = value;
                    if (title.includes('sexe') || title.includes('genre')) memberData.sexe = value;
                    if (title.includes('niveau')) memberData.niveau = value;
                    if (title.includes('objectif')) memberData.goals = value;
                    if (title.includes('date') || title.includes('naissance')) memberData.dob = value;
                    if (title.includes('profil')) memberData.profil = value;
                    
                    if (title.includes('première fois')) memberData.premiereFois = value;
                    if (title.includes('affiliation')) memberData.affiliation = value;
                    if (title.includes('activités physiques que vous pratiquez')) memberData.activitesPratiquees = value;
                    if (title.includes('sportives ou de loisirs')) memberData.loisirs = value;
                    if (title.includes('cet été') || title.includes('ce printemps')) memberData.activitesER = value; 
                    if (title.includes('limite actuellement') || title.includes('limites actuellement')) memberData.limites = value;
                    if (title.includes('vaincre ces limites')) memberData.vaincreLimites = value;

                    if (title.includes('participer activement')) memberData.engagementActif = value;
                    if (title.includes('partager mes objectifs')) memberData.engagementObjectifs = value;
                    if (title.includes('retiré sans préavis')) memberData.acceptationRetrait = value;
                }
            }

            if (memberData.email.toLowerCase() === searchEmail.toLowerCase()) {
                return memberData;
            }
        }
    } catch (error) {
        console.error("Erreur API Forms:", error);
        // On propage l'erreur : "Google indisponible" ne doit jamais être confondu avec "membre inconnu"
        throw error;
    }
    return null;
}

// ==========================================
// MIDDLEWARE : SÉCURITÉ
// ==========================================
const verifierToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Accès refusé. Token manquant.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token invalide ou expiré.' });
        req.user = decoded; 
        next();
    });
};

// ==========================================
// MIDDLEWARE : VÉRIFICATION ADMINISTRATEUR
// ==========================================
const ADMIN_EMAILS = [
    'teameliterunners@gmail.com', 
    'glodieilunga5@gmail.com'
];

const verifierAdmin = (req, res, next) => {
    // NOUVEAU : On vérifie si le Token a le rôle "admin"
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Privilèges d'administrateur requis." });
    }
    next();
};

// ==========================================
// ROUTE : CONNEXION ADMINISTRATEUR (Avec Mot de passe)
// ==========================================
app.post('/api/auth/admin-login', (req, res) => {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "E-mail et mot de passe requis." });
    }

    // 1. On vérifie si l'e-mail est dans la liste VIP
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
        return res.status(403).json({ message: "Cet e-mail n'a pas les droits d'administration." });
    }

    // 2. On vérifie si le mot de passe correspond à celui du fichier .env
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Mot de passe administrateur incorrect." });
    }

    // 3. Succès ! On génère un Token VIP avec le rôle "admin"
    const token = jwt.sign(
        { email: email.toLowerCase(), role: 'admin' },
        JWT_SECRET,
        { expiresIn: '4h' } // Le token admin expire après 4 heures
    );

    res.json({ message: 'Connexion Admin réussie', token: token });
});

// ==========================================
// ROUTE 1 : CONNEXION SANS MOT DE PASSE
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, phone } = req.body || {};

    if (typeof email !== 'string' || typeof phone !== 'string' || !email || !phone) {
        return res.status(400).json({ message: "E-mail et numéro de téléphone requis." });
    }

    try {
        // D'abord la base SQL (membres déjà confirmés ou nouveaux inscrits), sinon le Google Form
        const pool = await sql.connect(config);
        const dbResult = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT telephone FROM Candidatures WHERE email = @email');
        const memberData = dbResult.recordset[0]
            ? { phone: dbResult.recordset[0].telephone }
            : await getMemberFromForm(email);

        if (!memberData) {
            return res.status(404).json({ message: "Aucune candidature trouvée avec cet e-mail. Nouveau membre ? Cliquez sur « Première inscription »." });
        }

        const formPhone = memberData.phone ? memberData.phone.replace(/\D/g, '') : '';
        const inputPhone = phone.replace(/\D/g, '');

        if (formPhone !== inputPhone) {
            return res.status(401).json({ message: "Le numéro de téléphone ne correspond pas au dossier." });
        }

        const token = jwt.sign(
            { email: email.toLowerCase(), userId: 1 },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ message: 'Connexion réussie', token: token });

    } catch (error) {
        console.error("Erreur de connexion :", error);
        res.status(500).json({ message: "Erreur lors de la vérification de l'identité." });
    }
});

// ==========================================
// ROUTE 1 BIS : INSCRIPTION D'UN NOUVEAU MEMBRE (absent du Google Form)
// ==========================================
// ponytail: aucune vérification que l'e-mail appartient bien à la personne ; ajouter un code envoyé par e-mail si l'usurpation devient un problème
app.post('/api/auth/inscription', async (req, res) => {
    const { email, phone } = req.body || {};

    if (typeof email !== 'string' || typeof phone !== 'string' || !email || !phone) {
        return res.status(400).json({ message: "E-mail et numéro de téléphone requis." });
    }

    try {
        const pool = await sql.connect(config);
        const dbResult = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT 1 FROM Candidatures WHERE email = @email');

        if (dbResult.recordset.length > 0 || await getMemberFromForm(email)) {
            return res.status(409).json({ message: "Cet e-mail est déjà inscrit. Utilisez « Se connecter »." });
        }

        const token = jwt.sign(
            { email: email.toLowerCase(), phone: phone, userId: 1, nouveau: true },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ message: 'Inscription démarrée', token: token });

    } catch (error) {
        console.error("Erreur d'inscription :", error);
        res.status(500).json({ message: "Erreur lors de l'inscription." });
    }
});

// ==========================================
// ROUTE 2 : RÉCUPÉRER LE PROFIL
// ==========================================
app.get('/api/profil/import', verifierToken, async (req, res) => {
    const userEmail = req.user.email;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, userEmail)
            .query('SELECT * FROM Candidatures WHERE email = @email');

        if (result.recordset.length > 0) {
            // Le membre est dans SQL !
            const dbUser = result.recordset[0];

            // Astuce de pro : Formater la date SQL pour que le HTML (type="date") la comprenne (YYYY-MM-DD)
            let dateFormatee = '';
            if (dbUser.date_naissance) {
                const d = new Date(dbUser.date_naissance);
                dateFormatee = d.toISOString().split('T')[0];
            }

            // LE TRADUCTEUR : On fait correspondre SQL -> Frontend
            const mappedData = {
                email: dbUser.email,
                fullName: dbUser.nom_complet,
                sexe: dbUser.sexe,
                age: dbUser.age,
                dob: dateFormatee,
                phone: dbUser.telephone,
                niveau: dbUser.niveau_sportif,
                goals: dbUser.objectifs_trimestre,
                profil: dbUser.profil_type,
                premiereFois: dbUser.premiere_fois,
                affiliation: dbUser.affiliation_salle,
                activitesPratiquees: dbUser.activites_pratiquees,
                loisirs: dbUser.loisirs_interets,
                activitesER: dbUser.activites_ete_er,
                limites: dbUser.limites_actuelles,
                vaincreLimites: dbUser.vaincre_limites
            };

            res.json({ source: 'sql', data: mappedData });
            
        } else {
            // Le membre n'est pas dans SQL, on va chercher dans Google Forms
            const formData = await getMemberFromForm(userEmail);
            if (formData) {
                res.status(200).json({ source: 'Google Forms', data: formData });
            } else {
                res.status(404).json({ message: 'Aucune donnée trouvée.' });
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'importation :", error);
        res.status(500).json({ message: "Erreur lors de la récupération." });
    }
});

// ==========================================
// ROUTE 3 : ENREGISTREMENT / MISE À JOUR (UPSERT)
// ==========================================
app.post('/api/profil/confirmation', verifierToken, async (req, res) => {
    try {
        // 1. On attrape TOUTES les données du frontend
        // L'e-mail vient du token (et non du formulaire) : un membre ne peut modifier que SON profil
        const email = req.user.email;
        const {
            fullName, sexe, age, dob, phone, niveau, goals, profil,
            firstTime, gymAffiliation, activitiesPratice, activitiesInterest, springActivities, limits, strengths
        } = req.body;

        const pool = await sql.connect(config); 
        const request = pool.request();
        
        // 2. On prépare TOUTES les variables pour SQL
        request.input('email', sql.VarChar, email);
        request.input('nom_complet', sql.VarChar, fullName);
        request.input('sexe', sql.VarChar, sexe);
        request.input('age', sql.Int, age ? parseInt(age) : null); 
        request.input('date_naissance', sql.Date, dob ? dob : null); 
        request.input('telephone', sql.VarChar, phone);
        request.input('niveau_sportif', sql.VarChar, niveau);
        request.input('objectifs_trimestre', sql.Text, goals);
        request.input('profil_type', sql.VarChar, profil);
        
        // Les nouveaux champs
        request.input('premiere_fois', sql.NVarChar, firstTime || '');
        request.input('affiliation_salle', sql.NVarChar, gymAffiliation || '');
        request.input('activites_pratiquees', sql.NVarChar, activitiesPratice || '');
        request.input('loisirs_interets', sql.NVarChar, activitiesInterest || '');
        request.input('activites_ete_er', sql.NVarChar, springActivities || '');
        request.input('limites_actuelles', sql.NVarChar, limits || '');
        request.input('vaincre_limites', sql.NVarChar, strengths || '');
        request.input('statut', sql.NVarChar, req.user.nouveau ? 'Nouveau' : 'Confirmé');

        // 3. LA REQUÊTE GÉANTE
        const query = `
            IF EXISTS (SELECT 1 FROM Candidatures WHERE email = @email)
            BEGIN
                UPDATE Candidatures
                SET 
                    nom_complet = @nom_complet,
                    sexe = @sexe,
                    age = @age,
                    date_naissance = @date_naissance,
                    telephone = @telephone,
                    niveau_sportif = @niveau_sportif,
                    objectifs_trimestre = @objectifs_trimestre,
                    profil_type = @profil_type,
                    premiere_fois = @premiere_fois,
                    affiliation_salle = @affiliation_salle,
                    activites_pratiquees = @activites_pratiquees,
                    loisirs_interets = @loisirs_interets,
                    activites_ete_er = @activites_ete_er,
                    limites_actuelles = @limites_actuelles,
                    vaincre_limites = @vaincre_limites,
                    date_mise_a_jour = GETDATE()
                WHERE email = @email;
            END
            ELSE
            BEGIN
                INSERT INTO Candidatures (
                    user_id, email, nom_complet, sexe, age, date_naissance, 
                    telephone, niveau_sportif, objectifs_trimestre, profil_type, 
                    premiere_fois, affiliation_salle, activites_pratiquees, loisirs_interets,
                    activites_ete_er, limites_actuelles, vaincre_limites,
                    statut, date_soumission, date_mise_a_jour
                )
                VALUES (
                    1, @email, @nom_complet, @sexe, @age, @date_naissance, 
                    @telephone, @niveau_sportif, @objectifs_trimestre, @profil_type, 
                    @premiere_fois, @affiliation_salle, @activites_pratiquees, @loisirs_interets,
                    @activites_ete_er, @limites_actuelles, @vaincre_limites,
                    @statut, GETDATE(), GETDATE()
                );
            END
        `;

        await request.query(query);
        res.status(200).json({ message: "Profil enregistré avec succès dans la base de données !" });

    } catch (error) {
        console.error("Erreur SQL :", error);
        res.status(500).json({ message: "Erreur lors de la sauvegarde du profil." });
    }
});

// ==========================================
// ROUTE 4 : TABLEAU DE BORD (ADMIN)
// ==========================================
app.get('/api/admin/membres', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const pool = await sql.connect(config);
        // On récupère tout le monde, trié par date de mise à jour (les plus récents en premier)
        const result = await pool.request().query('SELECT * FROM Candidatures ORDER BY date_mise_a_jour DESC');
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Erreur SQL (Admin) :", error);
        res.status(500).json({ message: "Erreur lors de la récupération des membres." });
    }
});

// ==========================================
// ROUTE 5 : AJOUTER UN MEMBRE (ADMIN)
// ==========================================
// L'admin crée la fiche minimale ; le membre se connecte ensuite (e-mail + téléphone) et complète son profil
app.post('/api/admin/membres', verifierToken, verifierAdmin, async (req, res) => {
    const { fullName, email, phone } = req.body || {};

    if (typeof email !== 'string' || typeof phone !== 'string' || !email || !phone) {
        return res.status(400).json({ message: "E-mail et numéro de téléphone requis." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, email.toLowerCase())
            .input('nom_complet', sql.VarChar, fullName || '')
            .input('telephone', sql.VarChar, phone)
            .query(`
                IF EXISTS (SELECT 1 FROM Candidatures WHERE email = @email)
                    SELECT 0 AS cree
                ELSE
                BEGIN
                    INSERT INTO Candidatures (user_id, email, nom_complet, telephone, statut, date_soumission, date_mise_a_jour)
                    VALUES (1, @email, @nom_complet, @telephone, 'Nouveau', GETDATE(), GETDATE());
                    SELECT 1 AS cree
                END
            `);

        if (!result.recordset[0].cree) {
            return res.status(409).json({ message: "Un membre avec cet e-mail existe déjà." });
        }
        res.status(201).json({ message: "Membre ajouté." });
    } catch (error) {
        console.error("Erreur SQL (Ajout admin) :", error);
        res.status(500).json({ message: "Erreur lors de l'ajout du membre." });
    }
});

// ==========================================
// ROUTE 6 : SUPPRIMER UN MEMBRE (ADMIN)
// ==========================================
app.delete('/api/admin/membres/:email', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, req.params.email)
            .query('DELETE FROM Candidatures WHERE email = @email');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Membre introuvable." });
        }
        res.status(200).json({ message: "Membre supprimé." });
    } catch (error) {
        console.error("Erreur SQL (Suppression admin) :", error);
        res.status(500).json({ message: "Erreur lors de la suppression du membre." });
    }
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});