import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TranscriptionView from "../../TranscriptionView";

describe("Tests d'intégration - TranscriptionView", () => {
  test("affiche le message par défaut quand le texte est vide", () => {
    render(<TranscriptionView text="" />);
    expect(screen.getByText("Parlez pour voir la transcription…")).toBeInTheDocument();
  });

  test("affiche le texte fourni", () => {
    const sampleText = "Je veux créer une application de gestion de tâches";
    render(<TranscriptionView text={sampleText} />);
    expect(screen.getByText(sampleText)).toBeInTheDocument();
  });

  test("affiche le message par défaut si aucune prop text n'est fournie", () => {
    render(<TranscriptionView />);
    expect(screen.getByText("Parlez pour voir la transcription…")).toBeInTheDocument();
  });
});