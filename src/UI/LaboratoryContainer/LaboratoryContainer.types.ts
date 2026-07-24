import { ExperimentFilter } from "@domain/Laboratory/Entities/ExperimentFilter";
import { Experiment } from "../../Domain/Laboratory/Entities/Experiment";
import { PaginatorProps } from "@variamosple/variamos-components";

export interface ExperimentsContainerProps extends ExperimentsContainerInitialProps {
  queryData: {
    data: Experiment[];
    loadData: (filter: ExperimentFilter) => void;
    isLoading: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    totalPages: number;
    filter: ExperimentFilter;
  };
  onExperimentRestored?: () => void;
  handleExperimentCopy?: (experiment: Experiment) => void;
  onExperimentEdit?: (experiment: Experiment) => void;
}

export interface ExperimentsContainerInitialProps {
  onExperimentClick: (experiment: Experiment) => void;
  loadDataOnInit?: boolean;
  mode: "user" | "shared" | "group" | "archived";
  experimentSelected?: Experiment | null;
  onExperimentSelect?: (experiment: Experiment) => void;
  queryData: {
    data: Experiment[];
    loadData: (filter: ExperimentFilter) => void;
    isLoading: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    totalPages: number;
    filter: ExperimentFilter;
  };
  onExperimentEdit?: (experiment: Experiment) => void;
}

export interface ExperimentsListProps extends PaginatorProps {
    experiments: Experiment[];
    onExperimentClick: (experiment: Experiment) => void;
    mode: "user" | "shared" | "group" | "archived" | "template";
    onExperimentDelete?: (experiment: Experiment) => void;
    onExperimentArchive?: (experiment: Experiment) => void;
    onExperimentCopy?: (experiment: Experiment) => void;
    onExperimentShare?: (experiment: Experiment) => void;
    onExperimentRestore?: (experiment: Experiment) => void;
    selectedExperiment?: Experiment | null;
    onExperimentSelect?: (experiment: Experiment) => void;
    onExperimentEdit?: (experiment: Experiment) => void;
}