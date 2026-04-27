const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
app.use(cors());

var text= "";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    // keep original name with extension
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
   
    const filePath = req.file.path;
    // Build multipart form-data properly
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(), // critical for boundary
        },
      }
    );

    text = text + response.data.text;
    //res.status(200).send(response.data);
    extractPoints(text? text : response.data.text, res);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.status(500).send("Error transcribing audio");
    console.log(err.message);
  }
});


async function extractPoints(inputText ,res) {
  console.log(inputText);
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-5.1", // or gpt-4.1-mini
        messages: [
          {
            role: "system",
            // content: "You are an information extractor and dont invent just if there isnt the information we need leave a blank. Always return results in JSON with key: titre, description, budget, date-debut, date-fin, "
            content: description()
          },
          {
            role: "user",
            content: inputText
          }
        ],
        temperature: 0 // deterministic
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Extracted Points:\n");
    console.log(response.data.choices[0].message.content);
    res.status(200).send({"success" : true, "data": response.data.choices[0].message.content, "input": inputText});
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

function description() {
  return `Tu es un assistant chargé d’extraire des informations structurées.Il faut que tu comprennes le texte fourni par l’utilisateur et que tu en extraies les points clés selon les règles ci-dessous et comprendre le contexte du paragraphe pas seulement d'un mot ou deux.

⚠️ Sortie strictement en JSON VALIDE — aucun texte avant ou après. Pas de Markdown. Pas d’explication. Pas de phrase supplémentaire. Si tu hésites, renvoie null.

⚠️ IMPORTANT — NE DONNE JAMAIS UNE DATE ANTÉRIEURE À AUJOURD’HUI.
les textes peuvent etre imprecis de ce que l'utilisateur veut donc faut enticiper et donner la meilleure reponse possible selon le contexte.

--------------------------------------
🎯 RÈGLES D’EXTRACTION
--------------------------------------

1. "titre" (string ou null)
   - Utilise le titre explicitement indiqué.
   - Sinon null.

2. "description" (string ou null)
   - Résume en 1 phrase courte le but du projet.
   - Si aucune description claire → null.

3. "budget" (number ou null)
   - Extrais un montant même s’il est informel :
       - "40 000 €" → 40000
       - "5k€" / "5k" / "5 K" → 5000
       - "entre 20k et 30k" → 20000
       - "aucune idée" → null
   - Si plusieurs montants → sélectionne celui qui représente le budget du projet.
   - Si ambigu → null.

4. "date-debut" (date ISO yyyy-mm-dd ou null)
   - Toujours renvoyer une date **future ou égale à aujourd’hui**.
   - Interprétations :
       - "01/03/2026" ou "2026-03-01" → 2026-03-01
       - "février 2026" → 2026-02-01
       - "mi-janvier 2026" → 2026-01-15
       - "début 2026" → 2026-01-01
       - "ASAP" / "au plus vite" / "dès que possible" → date du jour = 2025-12-09
       - "dans 3 mois" / "commencer dans 2 mois" → date du jour + X mois
   - Si impossible d'inférer → null.

5. "date-fin" (date ISO yyyy-mm-dd ou null)
   - Retourne une date future cohérente avec le début.
   - Interprétations :
       - "fin 2026" → 2026-12-31
       - "avant l'été 2026" → 2026-06-01
       - "octobre 2026" → 2026-10-01
       - "priorité octobre, sinon novembre" → octobre = 2026-10-01
       - "release sous 3 mois" / "deadline dans 4 mois" → date du jour + X mois
    - Si ambigu → null.

--------------------------------------

Commence la réponse par '{' et termine par '}' sans rien d’autre.
Peut tu utiliser qu'une seule langue, la langue que tu as détectée en premier.`
}

app.listen(3000, () => console.log("Server running on http://localhost:3000"));