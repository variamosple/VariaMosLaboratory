import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";

export default function GroupExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  queryData, 
  onExperimentEdit}: ExperimentsContainerInitialProps) {

  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="group" 
      queryData={queryData} 
      onExperimentEdit={onExperimentEdit}
    />
  );
};

export const GroupExperimentsContainer = withPageVisit(
  GroupExperimentsContainerComponent,
  "GroupExperimentsList"
);
