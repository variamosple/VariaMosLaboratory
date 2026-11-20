import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import ProjectPersistenceService from "../../../../../DataProvider/Services/projectPersistenceService";
import SelectModelModal from "./SelectModelModal";

jest.mock("@variamosple/variamos-components/dist/Context/SessionContext", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const NO_PROJECTS = { owned_projects: [], shared_projects: [] };
const FAILED = "The public projects could not be loaded. Close this window and open it again to retry.";

describe("Select Models, lists that cannot be loaded", () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (show: boolean) =>
    act(async () => {
      root.render(<SelectModelModal show={show} onClose={() => undefined} setSelectedModels={() => undefined} selectedModels={[]} />);
    });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  test("the failure is shown instead of the loading, and opening the window again retries", async () => {
    let answerRetry: (value: any) => void = () => undefined;
    const lists = jest
      .spyOn(ProjectPersistenceService.prototype, "getProjectLists")
      .mockResolvedValueOnce({ privateResponse: NO_PROJECTS, publicResponse: [], error: FAILED })
      .mockReturnValueOnce(new Promise((resolve) => (answerRetry = resolve)));

    await render(true);
    expect(document.body.textContent).toContain(FAILED);
    expect(document.body.textContent).not.toContain("Loading projects...");

    await render(false);
    await render(true);
    expect(lists).toHaveBeenCalledTimes(2);
    // While it loads again, the old failure is no longer shown
    expect(document.body.textContent).toContain("Loading projects...");
    expect(document.body.textContent).not.toContain("could not be loaded");

    await act(async () => answerRetry({ privateResponse: NO_PROJECTS, publicResponse: [], error: "" }));
    expect(document.body.textContent).not.toContain("Loading projects...");
    expect(document.body.textContent).not.toContain("could not be loaded");
  });

  test("lists that are loaded are not loaded again", async () => {
    const lists = jest
      .spyOn(ProjectPersistenceService.prototype, "getProjectLists")
      .mockResolvedValue({ privateResponse: NO_PROJECTS, publicResponse: [], error: "" });

    await render(true);
    await render(false);
    await render(true);

    expect(lists).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("No projects or model found");
  });
});
