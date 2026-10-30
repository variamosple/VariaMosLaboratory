import {
  withPageVisit,
} from "@variamosple/variamos-components";
import { useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { SearchForm } from "../../SearchForm";
import ListFilters, { ListFilterValues } from "./ListFilters";
import ExperimentList  from "./ExperimentList/ExperimentList";
import {ExperimentsContainerProps} from "../LaboratoryContainer.types";
import { ExperimentFilter } from "../../../Domain/Laboratory/Entities/ExperimentFilter";
import { useState } from "react";
import * as alertify from "alertifyjs";
import { deleteExperiment, archiveExperiment, copyExperiment, shareExperiment, restoreExperiment } from "../../../DataProvider/Services/experimentService";
import { errorMessage } from "../../errorMessage";
import { Experiment } from "@domain/Laboratory/Entities/Experiment";
import ConfirmationModal from "../../ConfirmationModal/ConfirmationModal";
import ShareDialog from "../../Collaboration/Components/ShareDialog";
import { SharedAccess } from "@domain/Laboratory/Entities/Collaborator";

type ModalAction = "delete" | "archive" | "copy" | "restore" | null;

export default function ExperimentsContainerComponent({
  onExperimentClick, 
  loadDataOnInit = true, 
  mode, 
  queryData, 
  experimentSelected, 
  onExperimentSelect, 
  onExperimentRestored, 
  handleExperimentCopy,
  onExperimentEdit,
  projectId
 }: ExperimentsContainerProps) {
  
  const {
      data: experiments,
      loadData: loadExperiments,
      isLoading,
      currentPage,
      onPageChange,
      totalPages,
      filter: experimentsFilter,
  } = queryData;

  // LAB-EX-01: every list query keeps the selected project
  const projectFilter = () => Object.assign(new ExperimentFilter(), { projectId: projectId || undefined });

  const onReset = () => {
    loadExperiments(projectFilter());
  };

  const onSubmit = (name: string) => {
    loadExperiments(
      Object.assign(
        new ExperimentFilter(), 
        {
          ...experimentsFilter,
          name,
          projectId: projectId || undefined,
          pageNumber: 1,
        }
      )
    );
  };

  useEffect(() => {
    if (loadDataOnInit) {
      loadExperiments(Object.assign(new ExperimentFilter(), { projectId: projectId || undefined }));
    }
  }, [loadDataOnInit, loadExperiments, projectId]);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [sharingExperiment, setSharingExperiment] = useState(false);
    
  const onDeleteExperiment = (experiment: Experiment) => {
    alertify.notify("Deleting experiment...", "info");
  
    deleteExperiment(experiment.id)
      .then((response) => {
        alertify.dismissAll();
        // An experiment with completed executions is archived instead of deleted (LAB-EX-05)
        if (response.result === "archived") {
          alertify.warning(response.message);
        } else {
          alertify.success("Experiment deleted successfully");
        }
        queryData.onPageChange(queryData.currentPage);
      })
      .catch((error) => {
        alertify.dismissAll();
        alertify.error(errorMessage(error, "Error when trying to delete the experiment"));
      });
  };
  
  const onArchiveExperiment = (experiment: Experiment) => {
    const { id } = experiment || {};

    alertify.notify("Archiving experiment...", "info");

    archiveExperiment(id)
      .then(() => {
        alertify.dismissAll();
        alertify.success("Experiment archived successfully");
        queryData.onPageChange(queryData.currentPage);
      })
      .catch((error) => {
        alertify.dismissAll();
        alertify.error(errorMessage(error, "Error when trying to archive the experiment"));
      });
  };
  
  const onCopyExperiment = (experiment: Experiment) => {
    const { id } = experiment || {};

    alertify.notify("Copying experiment...", "info");

    copyExperiment(id, projectId || undefined)
      .then(() => {
        alertify.dismissAll();
        alertify.success("Experiment copied successfully");
        if (handleExperimentCopy) {
            handleExperimentCopy(experiment);
        } else {
            queryData.onPageChange(queryData.currentPage);
        }
      })
      .catch((error) => {
        alertify.dismissAll();
        alertify.error(errorMessage(error, "Error when trying to copy the experiment"));
      });
  };

  const onShareExperiment = (experiment: Experiment, email: string, access: SharedAccess) => {
    const { id } = experiment || {};

    alertify.notify("Sharing experiment...", "info");

    shareExperiment(id, email, access)
      .then(() => {
        alertify.dismissAll();
        alertify.success("Experiment shared successfully");
        queryData.onPageChange(queryData.currentPage);
      })
      .catch((error) => {
        alertify.dismissAll();
        alertify.error(errorMessage(error, "Error when trying to share the experiment"));
      });
  };
  
  const onRestoreExperiment = async (experiment: Experiment) => {
    try {
      await restoreExperiment(experiment.id);
      alertify.success("Experiment restored successfully");
      onExperimentRestored();
    } catch (error) {
      alertify.error(errorMessage(error, "Error when trying to restore the experiment"));
    }
  };

  const onExperimentDelete = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setModalAction("delete");
  };

  const onExperimentArchive = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setModalAction("archive");
  };

  const onExperimentCopy = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setModalAction("copy");
  };

  const onExperimentShare = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setSharingExperiment(true);
  };

  const onExperimentRestore = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setModalAction("restore");    
  }

  const modalConfig = {
    delete: {
      message: "Are you sure you want to delete the experiment?",
      variant: "danger",
      action: onDeleteExperiment,
    },
    archive: {
      message: "Are you sure you want to archive the experiment?",
      variant: "primary",
      action: onArchiveExperiment,
    },
    copy: {
      message: "Are you sure you want to copy the experiment?",
      variant: "primary",
      action: onCopyExperiment,
    },
    restore: {
      message: "Are you sure you want to restore the experiment?",
      variant: "primary",
      action: onRestoreExperiment,
    }
  };

  const currentConfig = modalAction? modalConfig[modalAction]: null;

  
  return (
    <div>
      <SearchForm
        isLoading={isLoading}
        onSearchReset={onReset}
        onSubmit={onSubmit}
      />
      <ListFilters
        onApply={(filters: ListFilterValues) =>
          loadExperiments(
            Object.assign(new ExperimentFilter(), {
              name: experimentsFilter?.name,
              projectId: projectId || undefined,
              pageNumber: 1,
              ...filters,
            })
          )
        }
      />

      {isLoading && (
        <div className="w-100 text-center">
          <Spinner
            animation="border"
            role="status"
            variant="primary"
            className="mx-3"
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {!isLoading && (
        <ExperimentList
          experiments={experiments}
          onExperimentClick={onExperimentClick}
          currentPage={currentPage}
          onPageChange={onPageChange}
          totalPages={totalPages}
          mode={mode}
          onExperimentDelete={onExperimentDelete}
          onExperimentArchive={onExperimentArchive}
          onExperimentCopy={onExperimentCopy}
          onExperimentShare={onExperimentShare}
          onExperimentRestore={onExperimentRestore}
          selectedExperiment={experimentSelected}
          onExperimentSelect={onExperimentSelect}
          onExperimentEdit={onExperimentEdit}
        />
      )}
      <ConfirmationModal
        show={modalAction !== null}
        confirmButtonVariant={currentConfig?.variant}
        message={currentConfig?.message}
        onConfirm={() => {
          if (selectedExperiment && currentConfig) {
            currentConfig.action(selectedExperiment);
          }

          setSelectedExperiment(null);
          setModalAction(null);
        }}
        onCancel={() => {
          setSelectedExperiment(null);
          setModalAction(null);
        }}
      />

    {sharingExperiment && (
      <ShareDialog 
        show={sharingExperiment} 
        onHide={() => setSharingExperiment(false)} 
        experiment={selectedExperiment} 
        onShareExperiment={onShareExperiment}/>
    )}
    </div>
  );
};

export const ExperimentsContainer = withPageVisit(
  ExperimentsContainerComponent,
  "ExperimentsList"
);
