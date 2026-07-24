import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import { SolverConfigs } from "./SolverConfig";

export class Scenario {
    id: string
    modelId?: string;
    model?: Model;
    solverConfigs?: SolverConfigs;
    constructor(id: string, modelId?: string, model?: Model, solverConfigs?: SolverConfigs) {
        this.id = id;
        this.modelId = modelId;
        this.model = model;
        this.solverConfigs = solverConfigs;
    }
}