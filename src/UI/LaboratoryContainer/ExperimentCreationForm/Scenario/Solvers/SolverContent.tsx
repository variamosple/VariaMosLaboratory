import { defaultSolverSettings, SolverConfigs, SolverDescriptor } from "../../../../../Domain/Laboratory/Entities/SolverConfig";
import { Alert, Button, Spinner, Tab, Tabs } from "react-bootstrap";
import SolverSettingsForm from "./SolverSettingsForm";
import { useEffect, useState } from "react";
import { getSolvers } from "../../../../../DataProvider/Services/catalogService";
import { errorMessage } from "../../../../errorMessage";

type SolverContentProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
    /** Ids must differ between scenarios: every scenario pane stays in the page. */
    idPrefix: string;
};

/** Solvers come from the Reasoning module catalog, with their versions and parameters (LAB-CF-02). */
export default function SolverContent({ solverConfigs, setSolverConfigs, idPrefix }: SolverContentProps) {
    const [catalog, setCatalog] = useState<SolverDescriptor[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>(Object.keys(solverConfigs)[0] || "");

    useEffect(() => {
        getSolvers()
            .then(setCatalog)
            .catch((error) => setLoadError(errorMessage(error, "The solver catalog could not be loaded.")));
    }, []);

    const toggleSolver = (solver: SolverDescriptor) => {
        setSolverConfigs(prev => {
            if (prev[solver.id]) {
                const updatedConfig = { ...prev };
                delete updatedConfig[solver.id];
                setActiveTab(Object.keys(updatedConfig)[0] || "");
                return updatedConfig;
            }
            setActiveTab(solver.id);
            return { ...prev, [solver.id]: defaultSolverSettings(solver) };
        });
    };

    if (loadError) {
        return <Alert variant="danger">{loadError}</Alert>;
    }

    if (!catalog) {
        return <Spinner animation="border" size="sm" />;
    }

    const unknownSolvers = Object.keys(solverConfigs).filter((id) => !catalog.some((solver) => solver.id === id));
    const selected = catalog.filter((solver) => solverConfigs[solver.id]);

    return (
    <>
        <div className="mb-4">
            <label className="form-label">
                Solvers
            </label>

            <div className="d-flex gap-4 flex-wrap">
                {catalog.map((solver) => (
                    <div className="form-check d-flex align-items-center" key={solver.id}>
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`${idPrefix}-solver-${solver.id}`}
                            checked={!!solverConfigs[solver.id]}
                            onChange={() => toggleSolver(solver)}
                        />
                        <label className="form-check-label ms-2" htmlFor={`${idPrefix}-solver-${solver.id}`}>
                            {solver.name}
                        </label>
                    </div>
                ))}
            </div>

            {unknownSolvers.length > 0 && (
                <Alert variant="warning" className="small mt-2 mb-0 d-flex justify-content-between align-items-center">
                    <span>No longer offered by the Reasoning module: {unknownSolvers.join(", ")}.</span>
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => setSolverConfigs(prev =>
                            Object.fromEntries(Object.entries(prev).filter(([id]) => !unknownSolvers.includes(id)))
                        )}
                    >
                        Remove
                    </Button>
                </Alert>
            )}
        </div>

        {/* Solver configuration */}
        {selected.length > 0 && (
            <div className="mb-4">
                <label className="form-label">
                    Solver Configuration
                </label>

                <Tabs activeKey={activeTab} id={`${idPrefix}-solver-config-tabs`} className="mb-3" onSelect={(k) => k && setActiveTab(k)}>
                    {selected.map((solver) => (
                        <Tab eventKey={solver.id} title={solver.name} key={solver.id}>
                            <SolverSettingsForm
                                idPrefix={idPrefix}
                                solver={solver}
                                settings={solverConfigs[solver.id]}
                                onChange={(settings) => setSolverConfigs(prev => ({ ...prev, [solver.id]: settings }))}
                            />
                        </Tab>
                    ))}
                </Tabs>
            </div>
        )}
    </>
    );
}
