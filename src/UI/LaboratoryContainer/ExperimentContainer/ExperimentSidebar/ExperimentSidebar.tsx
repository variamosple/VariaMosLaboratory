import { Experiment, ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";
import { ExperimentRoleEnum } from "../../../../Domain/Laboratory/Entities/Collaborator";
import ExecutionCard from "./ExecutionCard/ExecutionCard";
import ExperimentDetailsCard from "./ExperimentDetailsCard/ExperimentDetailsCard";
import { Run } from "../../../../Domain/Laboratory/Entities/Run";

type ExperimentSidebarProps = {
    experiment: Experiment;
    detailedExperiment: ExperimentDetailed;
    onEditExperiment: () => void;
    onMarkReady: () => void;
    readyProblems: string[];
    isMarkingReady: boolean;
    mode: "allowed" | "restricted";
    activeRun: Run | null;
    onRun: () => void;
    onCancelRun: (run: Run) => void;
    isStartingRun: boolean;
    isCancellingRun: boolean;
};

export default function ExperimentSidebar({ experiment, detailedExperiment, onEditExperiment, onMarkReady, readyProblems, isMarkingReady, mode, activeRun, onRun, onCancelRun, isStartingRun, isCancellingRun }: ExperimentSidebarProps) {
    // LAB-COL-01: write and execute are given separately
    const fallback = detailedExperiment.userRole !== ExperimentRoleEnum.VIEWER;
    const canWrite = mode === "allowed" && (detailedExperiment.permissions?.write ?? fallback);
    const canExecute = mode === "allowed" && (detailedExperiment.permissions?.execute ?? fallback);

    return (
        <div className="experiment-side mt-5">
            {mode === "allowed" && (
                <ExecutionCard
                    status={detailedExperiment.status}
                    canWrite={canWrite}
                    canExecute={canExecute}
                    onMarkReady={onMarkReady}
                    readyProblems={readyProblems}
                    isMarkingReady={isMarkingReady}
                    activeRun={activeRun}
                    onRun={onRun}
                    onCancelRun={onCancelRun}
                    isStartingRun={isStartingRun}
                    isCancellingRun={isCancellingRun}
                />
            )}

            <ExperimentDetailsCard
                experiment={experiment}
                detailedExperiment={detailedExperiment}
                onEditExperiment={onEditExperiment}
                canWrite={canWrite}
            />
        </div>
    );
}
