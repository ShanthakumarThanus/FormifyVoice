import { useState, useRef, useEffect } from "react";

export default function LiveRecorder({ onTranscription, onRecordingComplete, setFormdata }) {
  // --- États ---
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  // --- Refs ---
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]); // Pour l'envoi API (vidé régulièrement)
  const fullAudioChunks = useRef([]); // Pour la sauvegarde locale (jamais vidé pendant le record)
  const chunkIntervalRef = useRef(null);

  // --- Refs Visuel ---
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Démarrage ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. SETUP VISUEL
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      // 2. SETUP TIMER
      setDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // 3. SETUP ENREGISTREMENT
      fullAudioChunks.current = []; // Reset du buffer complet
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);       // Pour l'API
          fullAudioChunks.current.push(e.data); // Pour la liste locale
        }
      };

      mediaRecorderRef.current.onstop = sendChunk; // Continue d'envoyer le dernier morceau
      mediaRecorderRef.current.start();
      setRecording(true);

      // Découpe toutes les 3 secondes pour l'API
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 3000);

    } catch (error) {
      console.error("Erreur micro:", error);
    }
  };

  // --- Arrêt ---
  const stopRecording = () => {
    clearInterval(chunkIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    cancelAnimationFrame(animationRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Création de l'URL audio pour la liste
    // Petit délai pour s'assurer que le dernier chunk est arrivé
    setTimeout(() => {
        const fullBlob = new Blob(fullAudioChunks.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(fullBlob);
        
        if (onRecordingComplete) {
            onRecordingComplete({
                id: Date.now(),
                url: audioUrl,
                duration: duration,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    }, 100);

    // Couper le flux hardware
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setRecording(false);
  };

  // --- Envoi Backend ---
  const sendChunk = async () => {
    if (chunks.current.length === 0) return;

    const blob = new Blob(chunks.current, { type: "audio/webm" });
    chunks.current = [];

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    try {
      const response = await fetch("http://localhost:3000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) return;

      const payload = await response.json();

      // payload.data may be a JSON string or an object depending on the backend
      let extracted = payload.data;

      if (typeof extracted === "string") {
        // Try to find JSON inside string (models sometimes return code blocks or extra text)
        const firstBrace = extracted.indexOf("{");
        const lastBrace = extracted.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = extracted.slice(firstBrace, lastBrace + 1);
          try {
            extracted = JSON.parse(jsonStr);
          } catch (e) {
            // keep original string if parse fails
          }
        }
      }

      // Normalize mapping to the ProjectForm shape
      const mapped = {};
      if (extracted && typeof extracted === "object") {
        mapped.titre = extracted.titre ?? extracted.title ?? null;
        mapped.description = extracted.description ?? extracted.desc ?? null;
        // budget: try to cast to number if possible
        if (extracted.budget != null) {
          const num = Number(String(extracted.budget).replace(/[^0-9.-]+/g, ""));
          mapped.budget = Number.isFinite(num) ? num : null;
        } else {
          mapped.budget = null;
        }

        // dates: support several key names (date-debut, date_debut, debut)
        mapped.debut = extracted["date-debut"] ?? extracted["date_debut"] ?? extracted.debut ?? null;
        mapped.fin = extracted["date-fin"] ?? extracted["date_fin"] ?? extracted.fin ?? null;

        // fonctionnalités / features
        mapped.fonctionnalites = extracted.fonctionnalites ?? extracted.features ?? null;
      }

      // Call the transcription handler with a readable string (keep existing behavior)
      if (onTranscription) {
        if (typeof payload.data === "string") onTranscription(payload.data);
        else onTranscription(JSON.stringify(payload.data));
      }

      // Update the form data in the parent (App)
      if (setFormdata) {
        setFormdata((prev = {}) => {
          const next = { ...prev };
          Object.keys(mapped).forEach((k) => {
            const v = mapped[k];
            // Only overwrite when value is not null/undefined/empty string
            if (v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")) {
              next[k] = v;
            }
          });
          return next;
        });
      }
    } catch (error) {
      console.error("Error sending chunk:", error);
    }
  };
﻿


  // --- Dessin Canvas ---
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = "#fff0f0"; // Match background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ef4444";
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  };

  return (
    <div className="recorder-container">
      <button 
        className={`record-btn ${recording ? "recording" : "idle"}`}
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? "⏹ Stop" : "🎙 Record"}
      </button>

      <div className={`visualizer-area ${recording ? "visible" : ""}`}>
        <div className="timer">{formatTime(duration)}</div>
        <canvas ref={canvasRef} width="300" height="60" className="audio-canvas"></canvas>
      </div>
    </div>
  );
}