import {
  usePaginatedQuery,
  withPageVisit,
} from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentContainer";
import {ExperimentContainerInitialProps} from "../LaboratoryContainer.types";
import { ExperimentFilter } from "../../../Domain/Laboratory/Entities/ExperimentFilter";
import { Experiment } from "../../../Domain/Laboratory/Entities/Experiment";
import { getArchivedExperiments } from "../../../DataProvider/Services/experimentService";


export default function ArchivedExperimentsContainerComponent({onExperimentClick, loadDataOnInit = true, experimentSelected, onExperimentSelect }: ExperimentContainerInitialProps) {

    const queryData = usePaginatedQuery<ExperimentFilter, Experiment>({
      queryFunction: getArchivedExperiments,
      initialFilter: new ExperimentFilter(),
    });
  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="archived" 
      queryData={queryData} 
      experimentSelected={experimentSelected}
      onExperimentSelect={onExperimentSelect}
    />
  );
};

export const GroupExperimentsContainer = withPageVisit(
  ArchivedExperimentsContainerComponent,
  "GroupExperimentsList"
);
