import { SolverConfigs, SolverType } from "../../../../../../Domain/Laboratory/Entities/SolverConfig";

type SolverConfigFormProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
    solver: SolverType;
    VariableSelectionOptions?: { value: string; label: string; description: string }[];
    ValueSelectionOptions?: { value: string; label: string; description: string }[];
};


export default function SolverConfigForm({ solverConfigs, setSolverConfigs, solver, VariableSelectionOptions, ValueSelectionOptions }: SolverConfigFormProps) { 
    const supportsHeuristics = solver === SolverType.Minizinc || solver === SolverType.SwiProlog;

    const selectedVariableSelection = supportsHeuristics ? VariableSelectionOptions?.find(
                o => o.value === solverConfigs[solver].variableSelection
            ) : undefined;

    const selectedValueSelection = supportsHeuristics ? ValueSelectionOptions?.find(
                o => o.value === solverConfigs[solver].valueSelection
            ) : undefined;

    return (
        <div className="config-form">
            <div className="mb-3">
                <label htmlFor="timeout" className="form-label">
                    Time Out (seconds)
                </label>
                <input
                    type="number"
                    className="form-control"
                    id="timeout"
                    value={solverConfigs[solver].timeOut}
                    onChange={(e) => setSolverConfigs(prev => ({
                        ...prev,
                        [solver]: {
                            ...prev[solver],
                            timeOut: parseInt(e.target.value) || solverConfigs[solver].timeOut
                        }
                    }))}
                />
            </div>
            <div className="mb-3">
                <label htmlFor="random-seed" className="form-label">
                    Random Seed
                </label>
                <input 
                    type="number" 
                    className="form-control" 
                    id="random-seed"
                    value={solverConfigs[solver].randomSeed}
                    onChange={(e) => setSolverConfigs(prev => ({
                        ...prev,
                        [solver]: {
                            ...prev[solver],
                            randomSeed: parseInt(e.target.value) || solverConfigs[solver].randomSeed
                        }
                    }))}
                />
            </div>
            {supportsHeuristics && (
                <>
                <div className="mb-3">
                    <label htmlFor="variable-selection" className="form-label">
                        Variable Selection
                    </label>
                    <select
                        id="variable-selection"
                        className="form-select"
                        value={solverConfigs[solver].variableSelection}
                        onChange={(e) => setSolverConfigs(prev => ({
                            ...prev,
                            [solver]: {
                                ...prev[solver],
                                variableSelection: e.target.value as "default" | "first_fail" | "most_constrained"
                            }
                        }))}
                    >
                        {VariableSelectionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <small className="text-muted d-block mt-1">
                        {selectedVariableSelection?.description}
                    </small>
                </div>
                <div className="mb-3">
                    <label htmlFor="value-selection" className="form-label">
                        Value Selection
                    </label>
                    <select
                        id="value-selection"
                        className="form-select"
                        value={solverConfigs[solver].valueSelection || "default"}
                        onChange={(e) => setSolverConfigs(prev => ({
                            ...prev,
                            [solver]: {
                                ...prev[solver],
                                valueSelection: e.target.value as "default" | "min_first" | "max_first" | "split_domain"
                            }
                        }))}
                    >
                        {ValueSelectionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <small className="text-muted d-block mt-1">
                        {selectedValueSelection?.description}
                    </small>
                </div>
            </>
            )}
        </div>
    );
}