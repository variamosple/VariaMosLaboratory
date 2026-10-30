import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { SolverDescriptor } from "../../Domain/Laboratory/Entities/SolverConfig";

let solvers: Promise<SolverDescriptor[]> | null = null;

/**
 * GET /catalog/solvers
 * Solvers offered by the Reasoning module, loaded once per page.
 */
export const getSolvers = (): Promise<SolverDescriptor[]> => {
  if (!solvers) {
    solvers = LABORATORY_CLIENT.get("/catalog/solvers")
      .then((response) => response.data)
      .catch((error) => {
        solvers = null;
        console.error("Error fetching the solver catalog:", error);
        throw error;
      });
  }
  return solvers;
};

/** Forgets the loaded catalog (tests). */
export const resetSolverCatalog = () => {
  solvers = null;
};
