/**
 * Solvers come from the Reasoning module (GET /catalog/solvers), not from the
 * interface: their versions and parameters are described by the catalog (LAB-CF-02).
 */
export interface SolverParameter {
  name: string;
  label: string;
  type: "integer" | "enum";
  default: number | string;
  description?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string; description?: string }[];
}

export interface SolverDescriptor {
  id: string;
  name: string;
  /** Newest first. An experiment always pins one (LAB-R-03). */
  versions: string[];
  parameters: SolverParameter[];
}

/** The pinned version and the parameter values of one solver in a scenario. */
export type SolverSettings = { version?: string } & Record<string, string | number | undefined>;

/** Settings of each selected solver, keyed by solver id. */
export type SolverConfigs = Record<string, SolverSettings>;

/** Newest version and default value of every parameter. */
export const defaultSolverSettings = (solver: SolverDescriptor): SolverSettings => ({
  version: solver.versions[0],
  ...Object.fromEntries(solver.parameters.map((parameter) => [parameter.name, parameter.default])),
});
