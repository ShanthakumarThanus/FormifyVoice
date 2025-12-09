export default function ProjectForm({ data }) {
  // On sécurise l'accès aux données
  const project = data || {};
  console.log(data);
  return (
    <form className="project-form">
      
      {/* 1. Titre */}
      <div className="form-group">
        <label>Titre du projet</label>
        <input
          type="text"
          placeholder="Nom du projet..."
          value={project?.titre ?? ""}
          readOnly
        />
      </div>

      {/* 2. Description */}
      <div className="form-group">
        <label>Description</label>
        <textarea
          placeholder="Description du projet..."
          value={project.description ?? ""}
          rows={4}
          readOnly
        />
      </div>

      {/* 3. Budget */}
      <div className="form-group">
        <label>Budget (€)</label>
        <input
          type="number"
          placeholder="0"
          value={project.budget ?? ""}
          readOnly
        />
      </div>

      {/* 4. Dates */}
      <div className="form-row">
        <div className="form-group">
          <label>Date de début</label>
          <input
            type="text"
            value={project.debut ?? ""}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Date de fin</label>
          <input
            type="text"
            value={project.fin ?? ""}
            readOnly
          />
        </div>
      </div>

      {/* 5. Liste des Fonctionnalités */}
      <div className="form-group">
        <label>Fonctionnalités identifiées</label>
        <div className="tags-container">
          {project.fonctionnalites && project.fonctionnalites.length > 0 ? (
            project.fonctionnalites.map((feature, index) => (
              <span key={index} className="feature-tag">
                ✨ {feature}
              </span>
            ))
          ) : (
            <span className="no-data">En attente de détection...</span>
          )}
        </div>
      </div>

    </form>
  );
}