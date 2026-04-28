# Documentation de l'infrastructure - FormifyVoice

## 1. Présentation générale

FormifyVoice est une application web de retranscription vocale permettant de dicter un projet et de remplir automatiquement un formulaire.

L'infrastructure repose sur :
- **Azure Cloud** pour l'hébergement des machines virtuelles
- **GitHub** pour le versionnement du code source
- **Jenkins (Docker local)** pour l'intégration et le déploiement continu (CI/CD)

## 2. Architecture matérielle

┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│          PC LOCAL               │         │       VM AZURE FRONTEND         │
│                                 │         │       172.189.59.39             │
│  ┌────────────────────────┐     │         │                                 │
│  │  Jenkins (Docker)      │     │         │  ┌─────────────────────────┐    │
│  │  Port : 8080           │     │         │  │  Nginx (port 80)        │    │
│  │                        │     │         │  │  /var/www/html/         │    │
│  │  Pipeline CI :         │     │   SSH   │  └─────────────────────────┘    │
│  │  Checkout → Install    │     │  ──────►│                                 │
│  │  → Test → Build        │     │  SCP    │  Système : Ubuntu 24.04 LTS     │
│  │  → Deploy              │     │         │                                 │
│  └────────────────────────┘     │         └─────────────────────────────────┘
└─────────────────────────────────┘


## 3. Éléments de l'infrastructure

### 3.1. Machine virtuelle Azure — Frontend

- IP Publique : 172.189.59.39
- Système d'exploitation : Ubuntu 24.04 LTS
- Serveur Web : Nginx 1.24
- Dossier de déploiement : /var/www/html/
- Ports ouverts : 22 (SSH), 80 (HTTP), 8080 (Landing Page existante)
- Accès SSH : via clé privée .pem

## 3.2. Jenkins — Intégration Continue

- Emplacement : Docker sur le PC local
- Version : Jenkins LTS
- Port : 8080 (mappé depuis le conteneur)
- Job : FormifyVoice-Frontend (Pipeline)
- Déclencheur : Manuel (Build Now) ou automatique via webhook GitHub
- Node.js : Version 22.x LTS (installée automatiquement par le plugin)

## 3.3. Dépôt GitHub

- URL : https://github.com/ShanthakumarThanus/FormifyVoice
- Branche de déploiement : main
- Jenkinsfile : frontend/FormifyVoice/Jenkinsfile

## 4. Pipeline CI/CD

### 4.1. Étapes du pipeline

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ CHECKOUT │────►│ INSTALL  │────►│   TEST   │────►│  BUILD   │────►│  DEPLOY  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘

### 4.2. Détail des stages

#### Checkout

    - Commande : checkout scm
    - Récupère le code source depuis le dépôt GitHub

#### Install Dependencies

    - Commande : npm install
    - Installe toutes les dépendances Node.js nécessaires au projet

#### Test

    - Commande : npm test -- --coverage
    - Exécute les 12 tests Jest (unitaires, intégration, snapshot)
    - Génère un rapport de couverture de code

#### Build

    - Commande : npm run build
    - Génère les fichiers statiques optimisés avec Vite dans le dossier dist/

#### Deploy

    - Commande : scp -i ${SSH_KEY} -r dist/* ${VM_USER}@${VM_IP}:/var/www/html/
    - Copie les fichiers buildés sur la VM Azure via SSH

### 4.3. Credentials Jenkins

- azure-vm-ip (Secret text) : Adresse IP de la VM Azure
- azure-vm-user (Secret text) : Nom d'utilisateur SSH (azureuser)
- azure-ssh-key (SSH Private Key) : Clé privée .pem pour la connexion SSH

## 5. Tests frontend

### 5.1. Types de tests

#### Tests Unitaires (5 tests)

    - Fichier : formatters.test.js
    - Valide les fonctions extractFieldsFromText() et formatTime()
    - Teste des fonctions pures de manière isolée

#### Tests d'Intégration (6 tests)

    - Fichiers : ProjectForm.test.js et TranscriptionView.test.js
    - Vérifie le rendu des composants React avec différentes props
    - Teste l'affichage des données dans les champs du formulaire

#### Tests de Snapshot (1 test)

    - Fichier : App.snapshot.test.js
    - Capture le rendu HTML du composant App
    - Détecte les changements structurels non intentionnels

### 5.2. Résultat d'exécution

✅ Test Suites : 4 passed, 4 total
✅ Tests       : 12 passed, 12 total
✅ Snapshots   : 1 passed, 1 total


## 6. Déploiement

### Flux de déploiement

1. Un développeur push sur la branche `main`
2. Jenkins récupère le code
3. Les tests sont exécutés
4. Si les tests passent, l'application est buildée
5. Les fichiers du dossier `dist/` sont copiés sur la VM Azure via SCP
6. Nginx sert les fichiers sur le port 80

### Accès à l'application

- **URL** : `http://172.189.59.39`
- **Serveur** : Nginx 1.24
- **Dossier** : `/var/www/html/`

## 7. Maintenance

### Commandes utiles

```bash
# Connexion SSH à la VM
ssh -i "~/Downloads/ubuntu-vm1_key.pem" azureuser@172.189.59.39

# Redémarrer Nginx
sudo systemctl restart nginx

# Voir les logs Nginx
sudo tail -f /var/log/nginx/access.log

# Redéployer manuellement
scp -i ~/Downloads/ubuntu-vm1_key.pem -r dist/* azureuser@172.189.59.39:/var/www/html/
```

## 8. Sécurité

### Sécurité

- Les credentials sont stockés dans Jenkins 
- Les ports 22 (SSH) et 80 (HTTP) sont les seuls ouverts sur la VM
- La clé SSH est stockée localement et dans Jenkins
- Le pipeline échoue si les tests ne passent pas (pas de déploiement)