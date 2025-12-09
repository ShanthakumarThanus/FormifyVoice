import { useState, useRef } from "react";

export default function LiveRecorder({ onTranscription }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const intervalRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorderRef.current.onstop = sendChunk;

    mediaRecorderRef.current.start();
    setRecording(true);

    // Découpe toutes les 3 secondes
    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.start();
      }
    }, 3000);
  };

  const stopRecording = () => {
    clearInterval(intervalRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const sendChunk = async () => {
    if (chunks.current.length === 0) return;
    
    const blob = new Blob(chunks.current, { type: "audio/webm" });
    chunks.current = [];

    const formData = new FormData();
    formData.append("audio", blob,"recording.webm");

    try {
      const response = await fetch("http://localhost:3000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) return;

      const text = await response.json();
      onTranscription(text.data);
    } catch (error) {
      console.error("Error sending chunk:", error);
    }
  };

  return (
    <button onClick={recording ? stopRecording : startRecording}>
      {recording ? "Stop" : "Start Live"}
    </button>
  );
}