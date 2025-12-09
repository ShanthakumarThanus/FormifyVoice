export default function TranscriptionView({ text }) {
  return (
    <div style={{ whiteSpace: "pre-wrap", padding: "10px", border: "1px solid #ddd" }}>
      {text || "Parlez pour voir la transcription…"}
    </div>
  );
}