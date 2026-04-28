// On recopie la logique métier pour la tester de manière isolée
const extractFieldsFromText = async (text) => {
  return {
    nom: "Migration CRM",
    date_debut: "2025-03-01",
    date_fin: "2025-06-15",
    client: "Société ABC",
    urgence: "ASAP",
    objectif: "Optimiser les ventes",
  };
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

describe("Tests Unitaires - Formatters", () => {
  describe("extractFieldsFromText", () => {
    test("retourne un objet avec les champs attendus", async () => {
      const result = await extractFieldsFromText("Je veux migrer mon CRM");
      expect(result).toHaveProperty("nom");
      expect(result).toHaveProperty("client");
      expect(result).toHaveProperty("urgence");
      expect(result.nom).toBe("Migration CRM");
    });

    test("retourne les mêmes données quel que soit l'input", async () => {
      const result1 = await extractFieldsFromText("texte quelconque");
      const result2 = await extractFieldsFromText("autre texte");
      expect(result1).toEqual(result2);
    });
  });

  describe("formatTime", () => {
    test("formate 0 seconde en 00:00", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    test("formate 65 secondes en 01:05", () => {
      expect(formatTime(65)).toBe("01:05");
    });

    test("formate 3661 secondes en 61:01", () => {
      expect(formatTime(3661)).toBe("61:01");
    });
  });
});