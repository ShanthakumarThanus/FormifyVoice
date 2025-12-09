import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

<<<<<<< Updated upstream
function App() {
  const [count, setCount] = useState(0)
=======
export default function App() {
  const [transcript, setTranscript] = useState("");
  const [formData, setFormData] = useState({});

  // Fonction appelée à chaque chunk de voix
  const handleChunk = (chunkText) => {
    console.log(chunkText);
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
>>>>>>> Stashed changes

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
