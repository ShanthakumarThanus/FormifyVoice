// 1. On simule la réception du JSON (dans la vraie vie, ça viendrait de l'API OpenAI)
const rawData = require('./data_client.json'); 
// OU si tu le reçois via une requête HTTP (string), tu ferais : JSON.parse(responseBody)

async function traiterProjetClient(data) {
    try {
        console.log("📥 Réception des données client...\n");

        // 2. Extraction des informations essentielles (Destructuring)
        const { client, projet, fonctionnalites_cles, contraintes } = data;

        // 3. Validation basique (Business Logic)
        if (!contraintes.budget_estime || contraintes.budget_estime < 5000) {
            console.log("⚠️ ALERTE : Le budget semble trop bas pour ce type de projet.");
            return;
        }

        // 4. Création de l'objet "Fiche Projet" (prêt pour ta BDD type MongoDB/Postgres)
        const ficheProjet = {
            titre: `Projet ${projet.type} pour ${client.entreprise}`,
            client_id: client.contact,
            description: projet.objectif_principal,
            tags: [projet.domaine, ...contraintes.stack_tech_preferee],
            features_todo: fonctionnalites_cles,
            deadline_date: contraintes.deadline,
            budget: `${contraintes.budget_estime} ${contraintes.devise}`,
            status: "EN_ATTENTE_VALIDATION"
        };

        // 5. Affichage du résultat (Simulation d'enregistrement)
        console.log("✅ Projet validé et structuré pour la BDD :");
        console.log("------------------------------------------------");
        console.dir(ficheProjet, { depth: null, colors: true });
        console.log("------------------------------------------------");

        // Ici, tu ajouterais : await db.projects.create(ficheProjet);

    } catch (error) {
        console.error("Erreur lors du traitement du JSON :", error);
    }
}

// Exécution de la fonction
traiterProjetClient(rawData);