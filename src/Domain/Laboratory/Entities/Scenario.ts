import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import { SolverConfig } from "./SolverConfig";

export class Scenario {
    id: string    
    model: Model;
    solver_config?: SolverConfig;
    constructor(id: string, model: Model, solver_config: SolverConfig) {
        this.id = id;
        this.model = model;
        this.solver_config = solver_config;
    }
}