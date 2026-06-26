// We should import dynamically solvers and config from backend, but for now we hardcode the 3 existing

export enum SolverType {
  Minizinc = "minizinc",
  SwiProlog = "swi-prolog",
  Z3 = "z3",
}

export interface SolverConfig {
  timeOut: number;
  randomSeed: number;
}

export interface MinizincConfig extends SolverConfig {
  variableSelection?: "default" | "first_fail" | "most_constrained";
  valueSelection?: "default" | "min_first" | "max_first" | "split_domain";
}

export interface SwiConfig extends SolverConfig {
  variableSelection?: "default" | "ff" | "ffc";
  valueSelection?: "default" | "up" | "down" | "bisect";
}

export interface SolverConfigs {
  [SolverType.Minizinc]?: MinizincConfig;
  [SolverType.SwiProlog]?: SwiConfig;
  [SolverType.Z3]?: SolverConfig;
}

export const createMinizincConfig = (overrides: Partial<MinizincConfig> = {}): MinizincConfig => ({
  timeOut: 60,
  randomSeed: 42,
  variableSelection: "default",
  valueSelection: "default",
  ...overrides,
});

export const createSwiConfig = (overrides: Partial<SwiConfig> = {}): SwiConfig => ({
  timeOut: 60,
  randomSeed: 42,
  variableSelection: "default",
  valueSelection: "default",
  ...overrides,
});

export const createZ3Config = (overrides: Partial<SolverConfig> = {}): SolverConfig => ({
  timeOut: 60,
  randomSeed: 42,
  ...overrides,
});

export const createSolverConfig = (solver: SolverType): MinizincConfig | SwiConfig | SolverConfig => {
  switch (solver) {
    case SolverType.Minizinc:
      return createMinizincConfig();

    case SolverType.SwiProlog:
      return createSwiConfig();

    case SolverType.Z3:
      return createZ3Config();
  }
};