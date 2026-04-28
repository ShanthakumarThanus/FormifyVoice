import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectForm from "../../ProjectForm";

describe("Tests d'intégration - ProjectForm", () => {
  test("affiche les champs vides quand aucune donnée n'est fournie", () => {
    render(<ProjectForm data={{}} />);
    
    const titreInput = screen.getByPlaceholderText("Nom du projet...");
    expect(titreInput).toHaveValue("");
    
    const budgetInput = screen.getByPlaceholderText("0");
    expect(budgetInput).toHaveValue(null);
  });

  test("affiche les données fournies dans les bons champs", () => {
    const mockData = {
      titre: "Application Mobile",
      description: "Une super app",
      budget: 50000,
      debut: "2025-06-01",
      fin: "2025-12-31",
    };

    render(<ProjectForm data={mockData} />);
    
    expect(screen.getByPlaceholderText("Nom du projet...")).toHaveValue("Application Mobile");
    expect(screen.getByDisplayValue("Une super app")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2025-06-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2025-12-31")).toBeInTheDocument();
  });

  test("les champs sont en lecture seule", () => {
    render(<ProjectForm data={{ titre: "Test" }} />);
    const input = screen.getByPlaceholderText("Nom du projet...");
    expect(input).toHaveAttribute("readonly");
  });
});