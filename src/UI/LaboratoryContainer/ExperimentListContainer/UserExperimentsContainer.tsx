import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentsContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";

export default function UserExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  queryData, 
  projectId,
  onExperimentEdit }: ExperimentsContainerInitialProps) {

  return (
    <div>
      <ExperimentsContainerComponent 
        onExperimentClick={onExperimentClick} 
        loadDataOnInit={loadDataOnInit} 
        mode="user" 
        projectId={projectId}
        queryData={queryData}
        onExperimentEdit={onExperimentEdit}
      />
    </div>
  );
};

export const UserExperimentsContainer = withPageVisit(
  UserExperimentsContainerComponent,
  "UserExperimentsList"
);
