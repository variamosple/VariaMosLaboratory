import {
  usePaginatedQuery,
  withPageVisit,
} from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentContainer";
import {ExperimentContainerInitialProps} from "../LaboratoryContainer.types";
import { ExperimentFilter } from "../../../Domain/Laboratory/Entities/ExperimentFilter";
import { getExperimentsByUser } from "../../../DataProvider/Services/experimentService";
import { Experiment } from "@domain/Laboratory/Entities/Experiment";

export default function UserExperimentsContainerComponent({onExperimentClick, loadDataOnInit = true,}: ExperimentContainerInitialProps) {
  const queryData = usePaginatedQuery<ExperimentFilter, Experiment>({
    queryFunction: getExperimentsByUser,
    initialFilter: new ExperimentFilter(),
  });


  return (
    <div>
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="user" 
      queryData={queryData}
    />
    </div>
  );
};

export const UserExperimentsContainer = withPageVisit(
  UserExperimentsContainerComponent,
  "UserExperimentsList"
);
