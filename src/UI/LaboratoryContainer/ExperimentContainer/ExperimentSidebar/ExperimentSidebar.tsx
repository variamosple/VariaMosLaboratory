import { Experiment, ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";
import ExecutionCard from "./ExecutionCard/ExecutionCard";
import ExperimentDetailsCard from "./ExperimentDetailsCard/ExperimentDetailsCard";

type ExperimentSidebarProps = {
    experiment: Experiment;
    detailedExperiment: ExperimentDetailed;
    onEditExperiment: () => void;
    mode: "allowed" | "restricted";
};

export default function ExperimentSidebar({ experiment, detailedExperiment, onEditExperiment, mode }: ExperimentSidebarProps) {
    return (
        <div className="experiment-side mt-5">
            {mode === "allowed" && <ExecutionCard />}

            <ExperimentDetailsCard
                experiment={experiment}
                detailedExperiment={detailedExperiment}
                onEditExperiment={onEditExperiment}
                mode={mode}
            />
        </div>
    );
}