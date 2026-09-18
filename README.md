# ER Manager - Portail Web pour Elite Runners

**Un projet Full-Stack (de A à Z) développé pour moderniser la gestion d'un groupe sportif.**

🔗 **Voir le projet en direct :** [Lien vers ton site Netlify]

---

## le Projet en résumé
ER Manager est une application web créée sur mesure pour **Elite Runners**, une communauté d'athlètes. 
Avant ce projet, les inscriptions et le suivi des membres se faisaient manuellement via des formulaires. J'ai développé cette plateforme pour automatiser tout le processus, de l'inscription du coureur jusqu'à la gestion des profils par l'équipe de direction.

## Le problème résolu
* **Pour les coureurs :** Offrir un portail simple et moderne pour mettre à jour leurs objectifs sportifs et leurs informations, sans avoir à mémoriser un énième mot de passe complexe (système de vérification par téléphone/email).
* **Pour la direction :** Centraliser toutes les données de manière sécurisée dans une vraie base de données, accessible via un tableau de bord privé, mettant fin aux fichiers Excel éparpillés.

## Fonctionnalités Clés
1. **Importation intelligente :** L'application est capable d'aller chercher automatiquement les anciennes données d'un membre depuis Google Forms pour lui éviter de tout retaper.
2. **Espace Membre sécurisé :** Les coureurs peuvent modifier leur profil sportif et confirmer leur présence pour la saison.
3. **Tableau de Bord Administrateur :** Une zone restreinte (protégée par mot de passe) permettant à la direction de voir la liste des inscrits en temps réel.

## Ma boîte à outils (Technologies)
Pour construire ce projet de bout en bout, j'ai utilisé une architecture moderne séparant l'interface (Frontend) et la logique (Backend) :

* **L'Interface Utilisateur (Frontend) :** HTML, CSS, JavaScript. 
  * *Hébergement :* Déployé sur **Netlify** pour une mise en ligne rapide et performante.
* **Le Moteur de l'application (Backend) :** Node.js avec Express.js.
  * *Sécurité :* Utilisation de "Tokens" (JWT) pour sécuriser l'accès aux données.
  * *Hébergement :* Déployé sur le cloud **Render**.
* **La Base de Données :** Microsoft SQL Server (MSSQL).
  * *Hébergement :* Cloud **Somee.com** pour stocker les données de façon sécurisée et permanente.

## Pourquoi ce projet ? (Note aux recruteurs)
Ce projet démontre ma capacité à :
- **Gérer un projet complet :** De la compréhension du besoin utilisateur jusqu'à la mise en ligne finale (déploiement cloud).
- **Connecter différents systèmes :** Faire communiquer une interface web avec un serveur, une base de données distante, et une API externe (Google).
- **Assurer la sécurité :** Gérer les connexions sécurisées, les rôles (Utilisateur vs Admin), et la protection des données personnelles (CORS, variables d'environnement).
