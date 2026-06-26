import {
  usePaginatedQuery,
  withPageVisit,
} from "@variamosple/variamos-components";
import ExperimentContainerComponent from "./ExperimentContainer";
import {ExperimentContainerInitialProps} from "../LaboratoryContainer.types";
import { ExperimentFilter } from "../../../Domain/Laboratory/Entities/ExperimentFilter";
import { Experiment } from "../../../Domain/Laboratory/Entities/Experiment";
import { getSharedExperiments } from "../../../DataProvider/Services/experimentService";

export default function SharedExperimentsContainerComponent({onExperimentClick, loadDataOnInit = true, }: ExperimentContainerInitialProps) {

    const queryData = usePaginatedQuery<ExperimentFilter, Experiment>({
      queryFunction: getSharedExperiments,
      initialFilter: new ExperimentFilter(),
    });
  return (
    <ExperimentContainerComponent 
      onExperimentClick={onExperimentClick} 
      loadDataOnInit={loadDataOnInit} 
      mode="shared" 
      queryData={queryData} 
    />
  );
};

export const SharedExperimentsContainer = withPageVisit(
  SharedExperimentsContainerComponent,
  "SharedExperimentsList"
);
