import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";

export default function GroupExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  queryData, 
  projectId,
  onExperimentEdit}: ExperimentsContainerInitialProps) {

  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="group" 
      projectId={projectId}
      queryData={queryData} 
      onExperimentEdit={onExperimentEdit}
    />
  );
};

export const GroupExperimentsContainer = withPageVisit(
  GroupExperimentsContainerComponent,
  "GroupExperimentsList"
);
