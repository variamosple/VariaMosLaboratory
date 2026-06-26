
import { createSolverConfig, SolverConfigs, SolverType } from "../../../../../Domain/Laboratory/Entities/SolverConfig";
import { Tab, Tabs } from "react-bootstrap";
import MinizincConfigForm from "./SolversConfigForm/MinizincConfigForm";
import SwiPrologConfigForm from "./SolversConfigForm/SwiPrologConfigForm";
import Z3ConfigForm from "./SolversConfigForm/Z3ConfigForm";
import { useState } from "react";

type SolverContentProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
};

export default function SolverContent({ solverConfigs, setSolverConfigs }: SolverContentProps) {
    const [activeTab, setActiveTab] = useState<string>(Object.keys(solverConfigs)[0] || "");

    const toggleSolver = (solver: SolverType) => {
        setSolverConfigs(prev => {
            if (prev[solver]) {
                const updatedConfig = { ...prev };
                delete updatedConfig[solver];
                setActiveTab(Object.keys(updatedConfig)[0] || "");
                return updatedConfig;
            }
            setActiveTab(solver);
            return { ...prev, [solver]: createSolverConfig(solver) };
        });
    };

    return (
    <>
        <div className="mb-4">
            <label className="form-label">
                Solvers
            </label>

            <div className="d-flex gap-4 flex-wrap">
                <div className="form-check d-flex align-items-center">
                    <input className="form-check-input" type="checkbox" onChange={() => toggleSolver(SolverType.Minizinc)} id="minizinc"/>
                    <label className="form-check-label ms-2" htmlFor="minizinc">
                        Minizinc (Gecode)
                    </label>
                </div>

                <div className="form-check d-flex align-items-center">
                    <input className="form-check-input" type="checkbox" onChange={() => toggleSolver(SolverType.SwiProlog)} id="swi-prolog"/>
                    <label className="form-check-label ms-2" htmlFor="swi-prolog">
                        SWI-Prolog CLP(FD)
                    </label>
                </div>

                <div className="form-check d-flex align-items-center">
                    <input className="form-check-input" type="checkbox" onChange={() => toggleSolver(SolverType.Z3)} id="z3"/>
                    <label className="form-check-label ms-2" htmlFor="z3">
                        Microsoft Z3
                    </label>
                </div>
            </div>
        </div>

        {/* Solver configuration */}
        {Object.keys(solverConfigs).length > 0 && (
            <div className="mb-4">
                <label className="form-label">
                    Solver Configuration
                </label>

                <Tabs activeKey={activeTab} id="solver-config-tabs" className="mb-3" onSelect={(k) => k && setActiveTab(k)}>
                    {solverConfigs[SolverType.Minizinc] && (
                        <Tab eventKey={SolverType.Minizinc} title="Minizinc">
                            <MinizincConfigForm solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} />
                        </Tab>
                    )}
                    {solverConfigs[SolverType.SwiProlog] && (
                        <Tab eventKey={SolverType.SwiProlog} title="SWI-Prolog">
                            <SwiPrologConfigForm solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} />
                        </Tab>
                    )}
                    {solverConfigs[SolverType.Z3] && (
                        <Tab eventKey={SolverType.Z3} title="Microsoft Z3">
                            <Z3ConfigForm solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} />
                        </Tab>
                    )}
                </Tabs>
            </div>
        )}
    </>
    );
}