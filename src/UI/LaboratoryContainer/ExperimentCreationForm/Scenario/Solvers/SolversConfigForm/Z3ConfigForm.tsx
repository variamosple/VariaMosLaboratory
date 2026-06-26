import { SolverConfigs, SolverType } from "../../../../../../Domain/Laboratory/Entities/SolverConfig";
import ConfigForm from "./SolverConfigForm";

type Z3ConfigFormProps = {
    solverConfigs : SolverConfigs;
    setSolverConfigs: React.Dispatch<React.SetStateAction<SolverConfigs>>;
};


export default function Z3ConfigForm({ solverConfigs, setSolverConfigs,  }: Z3ConfigFormProps) {  
    return (
        <ConfigForm solver={SolverType.Z3} solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs}/>
    );
}