import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentsContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";



export default function SharedExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  queryData, 
  projectId,
  onExperimentEdit}: ExperimentsContainerInitialProps) {

  return (
    <ExperimentsContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="shared" 
      projectId={projectId}
      queryData={queryData}
      onExperimentEdit={onExperimentEdit} 
    />
  );
};

export const SharedExperimentsContainer = withPageVisit(
  SharedExperimentsContainerComponent,
  "SharedExperimentsList"
);
