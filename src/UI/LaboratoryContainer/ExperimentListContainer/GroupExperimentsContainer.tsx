import {
  usePaginatedQuery,
  withPageVisit,
} from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentContainer";
import {ExperimentContainerInitialProps} from "../LaboratoryContainer.types";
import { ExperimentFilter } from "../../../Domain/Laboratory/Entities/ExperimentFilter";
import { Experiment } from "../../../Domain/Laboratory/Entities/Experiment";
import { getGroupExperiments } from "../../../DataProvider/Services/experimentService";

export default function GroupExperimentsContainerComponent({onExperimentClick, loadDataOnInit = true, }: ExperimentContainerInitialProps) {

    const queryData = usePaginatedQuery<ExperimentFilter, Experiment>({
      queryFunction: getGroupExperiments,
      initialFilter: new ExperimentFilter(),
    });
  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="group" 
      queryData={queryData} 
    />
  );
};

export const GroupExperimentsContainer = withPageVisit(
  GroupExperimentsContainerComponent,
  "GroupExperimentsList"
);
