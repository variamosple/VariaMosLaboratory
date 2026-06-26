import { SolverConfigs, SolverType } from "../../../../../../Domain/Laboratory/Entities/SolverConfig";
import ConfigForm from "./SolverConfigForm";

type SwiPrologConfigFormProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
};


export default function SwiPrologConfigForm({ solverConfigs, setSolverConfigs,  }: SwiPrologConfigFormProps) {  
    const VariableSelectionOptions = [
        { value: "default", label: "Default", description: "Let the solver choose the search strategy." },
        { value: "ff", label: "First Fail (ff)", description: "Selects the variable with the smallest domain." },
        { value: "ffc", label: "First Fail + Constraints", description: "Uses domain size and constraint information."}
    ];

    const ValueSelectionOptions = [
    { value: "default", label: "Default", description: "Let the solver choose how values are explored."},
    { value: "up", label: "Ascending (up)", description: "Tests smaller values first." },
    { value: "down", label: "Descending (down)", description: "Tests larger values first." },
    { value: "bisect", label: "Bisect", description: "Splits the domain into two ranges." }
    ];

    return (
        <ConfigForm solver={SolverType.SwiProlog} solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} VariableSelectionOptions={VariableSelectionOptions} ValueSelectionOptions={ValueSelectionOptions} />
    );
}