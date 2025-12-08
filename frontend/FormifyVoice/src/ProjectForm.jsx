export default function ProjectForm({ data }) {
  return (
    <form style={{ display: "grid", gap: "10px", maxWidth: "400px", marginTop: "20px" }}>

      <input
        type="text"
        placeholder="Nom du projet"
        value={data?.nom || ""}
        readOnly
      />

      <input
        type="date"
        placeholder="Date de début"
        value={data?.date_debut || ""}
        readOnly
      />

      <input
        type="date"
        placeholder="Date de fin"
        value={data?.date_fin || ""}
        readOnly
      />

      <input
        type="text"
        placeholder="Client"
        value={data?.client || ""}
        readOnly
      />

      <input
        type="text"
        placeholder="Urgence"
        value={data?.urgence || ""}
        readOnly
      />

      <textarea
        placeholder="Objectif du projet"
        value={data?.objectif || ""}
        rows={3}
        readOnly
      />

    </form>
  );
}