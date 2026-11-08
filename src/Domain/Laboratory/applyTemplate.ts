import { ExperimentDetailed } from "./Entities/Experiment";
import { Metric } from "./Entities/Metric";
import { Scenario } from "./Entities/Scenario";
import { defaultSolverSettings, SolverConfigs, SolverDescriptor } from "./Entities/SolverConfig";

/** Marks the templates the Laboratory provides; not a label of the experiments made from them. */
export const PREDEFINED_LABEL = "predefined";

/** LAB-CF-05: the template a new experiment comes from, sent with its creation. */
export interface TemplateOrigin {
  id: string;
  version: number;
  name: string;
}

export interface AppliedTemplate {
  name: string;
  description: string;
  hypothesis: string;
  labels: string[];
  metrics: Metric[];
  scenarios: Scenario[];
  origin: TemplateOrigin;
  /** How many model references were not kept: the user picks models in the target project. */
  modelsLeftOut: number;
  /** Names of another user's private metrics, which the user cannot use. */
  metricsLeftOut: string[];
}

/**
 * The catalog's settings for a solver of the template: its newest version when the template names none
 * or one the catalog no longer offers, and the template's values of the parameters the catalog knows.
 * A solver the catalog does not offer is kept as it is, for the form to say so.
 */
function settingsOf(configs: SolverConfigs, catalog: SolverDescriptor[]): SolverConfigs {
  return Object.fromEntries(
    Object.entries(configs ?? {}).map(([solverId, settings]) => {
      const solver = catalog.find((candidate) => candidate.id === solverId);
      if (!solver) return [solverId, { ...settings }];
      const known = Object.fromEntries(
        Object.entries(settings ?? {}).filter(([name]) => solver.parameters.some((parameter) => parameter.name === name))
      );
      const version = settings?.version && solver.versions.includes(settings.version) ? settings.version : solver.versions[0];
      return [solverId, { ...defaultSolverSettings(solver), ...known, version }];
    })
  );
}

/**
 * LAB-CF-05: the base configuration a new experiment inherits from a template, for the creation form.
 * Scenarios get new ids. The template's models are kept only when the experiment goes to the template's own
 * project: elsewhere the user may not open them (LAB-NF-05) and picks models of their project instead.
 */
export function applyTemplate(
  template: ExperimentDetailed,
  target: { projectId: string; userId?: string | null; catalog: SolverDescriptor[]; newId: () => string }
): AppliedTemplate {
  const keepModels = !!template.projectId && template.projectId === target.projectId;
  let modelsLeftOut = 0;

  const scenarios = (template.scenarios ?? []).map((source) => {
    const models = keepModels ? (source.models ?? []).map(({ modelId, model }) => ({ modelId, model })) : [];
    if (!keepModels) modelsLeftOut += (source.models ?? []).length;
    const scenario = new Scenario(target.newId(), models, settingsOf(source.solverConfigs, target.catalog));
    scenario.name = source.name;
    if (source.operationalContext) {
      scenario.operationalContext = {
        activeFeatures: [...(source.operationalContext.activeFeatures ?? [])],
        inactiveFeatures: [...(source.operationalContext.inactiveFeatures ?? [])],
        extraConstraints: source.operationalContext.extraConstraints ?? "",
      };
    }
    return scenario;
  });

  const usable = (metric: Metric) => !metric.userId || metric.userId === target.userId;

  return {
    name: template.name,
    description: template.description ?? "",
    hypothesis: template.hypothesis ?? "",
    labels: (template.labels ?? []).filter((label) => label !== PREDEFINED_LABEL),
    metrics: (template.metrics ?? []).filter(usable),
    scenarios,
    origin: { id: template.id, version: template.version, name: template.name },
    modelsLeftOut,
    metricsLeftOut: (template.metrics ?? []).filter((metric) => !usable(metric)).map((metric) => metric.name),
  };
}
