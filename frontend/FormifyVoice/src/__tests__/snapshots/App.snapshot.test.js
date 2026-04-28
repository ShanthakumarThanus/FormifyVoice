import { render } from "@testing-library/react";
import App from "../../App";

describe("Tests de Snapshot - App", () => {
  test("le composant App correspond au snapshot", () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});