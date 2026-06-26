import { SolverConfigs, SolverType } from "../../../../../../Domain/Laboratory/Entities/SolverConfig";
import ConfigForm from "./SolverConfigForm";

type MinizincConfigFormProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
};


export default function MinizincConfigForm({ solverConfigs, setSolverConfigs,  }: MinizincConfigFormProps) {  
    const VariableSelectionOptions = [
        { value: "default", label: "Default", description: "Let the solver choose the search strategy." },
        { value: "first_fail", label: "First Fail", description: "Selects the variable with the smallest domain first. Often reduces search time." },
        { value: "most_constrained", label: "Most Constrained", description: "Prioritizes variables involved in the largest number of constraints." },
    ];

    const ValueSelectionOptions = [
        { value: "default", label: "Default", description: "Let the solver choose how values are explored." },
        { value: "min_first", label: "Min First", description: "Tests the smallest values first." },
        { value: "max_first", label: "Max First", description: "Tests the largest values first." },
        { value: "split_domain", label: "Split Domain", description: "Splits the domain into ranges instead of testing values one by one." },
    ];

    return (
        <ConfigForm solver={SolverType.Minizinc} solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} VariableSelectionOptions={VariableSelectionOptions} ValueSelectionOptions={ValueSelectionOptions} />
    );
}