# Documentation des Tests Frontend - FormifyVoice

## Types de tests implémentés

### 1. Tests Unitaires
- **Fichier** : `src/__tests__/unit/formatters.test.js`
- **Objectif** : Valider `extractFieldsFromText()` et `formatTime()` de manière isolée
- **Commande** : `npm test -- --testPathPattern=unit`
- **Résultat** : ✅ 5 tests passés

### 2. Tests d'Intégration
- **Fichiers** : `src/__tests__/integration/ProjectForm.test.js`, `TranscriptionView.test.js`
- **Objectif** : Vérifier le rendu des composants React avec des props variées
- **Commande** : `npm test -- --testPathPattern=integration`
- **Résultat** : ✅ 6 tests passés

### 3. Tests de Snapshot
- **Fichier** : `src/__tests__/snapshots/App.snapshot.test.js`
- **Objectif** : Détecter les changements structurels dans l'interface
- **Commande** : `npm test -- --testPathPattern=snapshot`
- **Résultat** : ✅ 1 snapshot créé

## Exécution globale
```bash
npm test -- --coverage