import { withPageVisit } from "@variamosple/variamos-components";
import ExperimentsContainerComponent from "./ExperimentsContainer";
import {ExperimentsContainerInitialProps} from "../LaboratoryContainer.types";

export default function UserExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  queryData, 
  onExperimentEdit }: ExperimentsContainerInitialProps) {

  return (
    <div>
      <ExperimentsContainerComponent 
        onExperimentClick={onExperimentClick} 
        loadDataOnInit={loadDataOnInit} 
        mode="user" 
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
