import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";


type ArchivedExperimentsContainerProps = ExperimentsContainerInitialProps & {
  onExperimentRestored: () => void;
  onCopyExperiment: () => void;
};

export default function ArchivedExperimentsContainerComponent({
    onExperimentClick, 
    loadDataOnInit = true, 
    experimentSelected, 
    onExperimentSelect, 
    onExperimentRestored, 
    queryData,
    onCopyExperiment
  }: ArchivedExperimentsContainerProps) {

  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="archived" 
      queryData={queryData} 
      experimentSelected={experimentSelected}
      onExperimentSelect={onExperimentSelect}
      onExperimentRestored={onExperimentRestored}
      handleExperimentCopy={onCopyExperiment}
    />
  );
};

export const GroupExperimentsContainer = withPageVisit(
  ArchivedExperimentsContainerComponent,
  "GroupExperimentsList"
);
