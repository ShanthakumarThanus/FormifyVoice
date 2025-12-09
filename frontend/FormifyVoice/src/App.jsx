import { useState, useEffect } from "react";
import LiveRecorder from "./LiveRecorder";
import ProjectForm from "./ProjectForm";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [formData, setFormData] = useState({});

  // Fonction appelée à chaque chunk de voix
  const handleChunk = (chunkText) => {
    setTranscript(prev => prev + " " + chunkText);
  };

  // Fonction qui contacte le backend (mockable pour l'instant)
  async function extractFieldsFromText(text) {
    // En attendant le backend, voici un mock :
    return {
      nom: "Migration CRM",
      date_debut: "2025-03-01",
      date_fin: "2025-06-15",
      client: "Société ABC",
      urgence: "ASAP",
      objectif: "Optimiser les ventes"
    };
  }

  // Effet : toutes les 5 secondes (ou moins), on met à jour le formulaire
  useEffect(() => {
    if (!transcript) return;

    const id = setTimeout(async () => {
      const json = await extractFieldsFromText(transcript);
      setFormData(json);
    }, 5000);

    return () => clearTimeout(id);
  }, [transcript]);

  return (
    <div style={{ padding: "20px" }}>
      <LiveRecorder onTranscription={handleChunk} />

      <h3>Transcription live :</h3>
      <pre style={{
        background: "#f5f5f5", padding: "10px", borderRadius: "5px", minHeight: "100px", color: "black"
      }}>
        {transcript || "Parlez pour commencer..."}
      </pre>

      <h3>Formulaire auto-rempli :</h3>
      <ProjectForm data={formData} />
    </div>
  );
}
