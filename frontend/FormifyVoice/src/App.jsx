import { useState, useEffect } from "react";
import LiveRecorder from "./LiveRecorder";
import ProjectForm from "./ProjectForm";
import "./App.css";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [formData, setFormData] = useState({});
  const [recordings, setRecordings] = useState([]);

  const handleChunk = (chunkText) => {
    setTranscript(chunkText);
  };

  const handleRecordingComplete = (newRecording) => {
    setRecordings((prev) => [newRecording, ...prev]);
  };

  // --- NOUVELLE FONCTION DE SUPPRESSION ---
  const deleteRecording = (id) => {
    // Demande de confirmation native
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?")) {
      // Si "Oui", on filtre la liste pour retirer l'élément
      setRecordings((prev) => prev.filter((rec) => rec.id !== id));
    }
  };

  async function extractFieldsFromText(text) {
    return {
      nom: "Migration CRM",
      date_debut: "2025-03-01",
      date_fin: "2025-06-15",
      client: "Société ABC",
      urgence: "ASAP",
      objectif: "Optimiser les ventes",
    };
  }

  useEffect(() => {
    if (!transcript) return;
    // const id = setTimeout(async () => {
    //   const json = await extractFieldsFromText(transcript);
    //   setFormData(json);
    // }, 5000);
    // return () => clearTimeout(id);
  }, [transcript]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎙️ Assistant de Projet IA</h1>
        <p className="subtitle">Dictez votre projet, l'IA s'occupe du reste.</p>
      </header>

      <main className="main-grid">
        
        {/* COLONNE 1 : Historique avec Suppression */}
        <section className="card history-section">
          <h3>📁 Enregistrements ({recordings.length})</h3>
          
          <div className="history-list">
            {recordings.length === 0 ? (
              <p className="empty-state">Aucun enregistrement.</p>
            ) : (
              recordings.map((rec) => (
                <div key={rec.id} className="history-item">
                  <div className="history-header-row">
                    <div className="history-info">
                      <span className="history-time">{rec.timestamp}</span>
                      <span className="history-duration">⏱ {rec.duration}s</span>
                    </div>
                    {/* Bouton de suppression */}
                    <button 
                      className="delete-btn" 
                      onClick={() => deleteRecording(rec.id)}
                      title="Supprimer l'enregistrement"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <audio controls src={rec.url} className="mini-player"></audio>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLONNE 2 : Enregistreur & Transcript */}
        <section className="card transcript-section">
          <div className="recorder-wrapper">
             <LiveRecorder 
                onTranscription={handleChunk} 
                onRecordingComplete={handleRecordingComplete}
                setFormdata={setFormData}

             />
          </div>
          
          <div className="transcript-box">
            {transcript || <span className="placeholder">La transcription apparaîtra ici...</span>}
          </div>
        </section>

        {/* COLONNE 3 : Le Formulaire */}
        <section className="card form-section">
          <h3>Données Extraites</h3>
          <div className="form-wrapper">
            <ProjectForm data={formData} />
          </div>
        </section>

      </main>
    </div>
  );
}

