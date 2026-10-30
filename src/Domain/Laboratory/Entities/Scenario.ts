import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import { SolverConfigs } from "./SolverConfig";

/**
 * LAB-CF-01 / LAB-R-03: copy of a model taken when the experiment became Ready,
 * with the semantics of its language (LAB-RP-01; null if pinned before it was kept).
 */
export interface PinnedModel {
    languageId: number | null;
    hash: string;
    pinnedAt: string;
    semanticsHash: string | null;
}

/** One input model of a scenario (LAB-CF-01). */
export interface ScenarioModel {
    modelId: string;
    model?: Model;
    pinned?: PinnedModel;
}

/** LAB-CF-04: features forced on or off, and extra constraints. */
export interface OperationalContext {
    activeFeatures: string[];
    inactiveFeatures: string[];
    extraConstraints: string;
}

export class Scenario {
    id: string
    name?: string;
    models: ScenarioModel[];
    solverConfigs: SolverConfigs;
    operationalContext?: OperationalContext;
    constructor(id: string, models: ScenarioModel[] = [], solverConfigs: SolverConfigs = {}) {
        this.id = id;
        this.models = models;
        this.solverConfigs = solverConfigs;
    }
}

/** Names of the elements of the scenario models: what an operational context can name. */
export const scenarioFeatures = (scenario: Scenario): string[] =>
    [...new Set(
        scenario.models.flatMap((ref) => (ref.model?.elements ?? []).map((element) => element.name).filter(Boolean))
    )].sort((a, b) => a.localeCompare(b));
