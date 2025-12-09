const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
   
    filePath = path.join(__dirname, "audio1.ogg");
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
    //res.status(200).send(response.data);
    extractPoints(response.data.text, res);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    response.status(500).send("Error transcribing audio");
    console.log(err);
  }
});

async function extractPoints(inputText ,res) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1", // or gpt-4.1-mini
        messages: [
          {
            role: "system",
            content: "You are an information extractor and dont invent just if there isnt the information we need leave a blank. Always return results in JSON with key: frequency of the payment."
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
    res.status(200).send(JSON.stringify(response.data))
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

app.listen(3000, () => console.log("Server running on http://localhost:3000"));