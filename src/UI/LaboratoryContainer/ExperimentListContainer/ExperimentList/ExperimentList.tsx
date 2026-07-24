import { Paginator } from "@variamosple/variamos-components";
import { Alert, Button, Table } from "react-bootstrap";
import { Archive, Copy, Share, Trash, PencilSquare } from "react-bootstrap-icons";

import { ExperimentsListProps } from "../../LaboratoryContainer.types";

import "./ExperimentList.css";
import { ExperimentRoleEnum } from "../../../../Domain/Laboratory/Entities/Collaborator";

export default function ExperimentsList({
  experiments,
  onExperimentClick,
  currentPage,
  onPageChange,
  totalPages,
  mode,
  onExperimentDelete,
  onExperimentArchive,
  onExperimentRestore,
  onExperimentCopy,
  onExperimentShare,
  selectedExperiment,
  onExperimentSelect,
  onExperimentEdit,
}: ExperimentsListProps) {
  if (!experiments?.length) {
    return <Alert variant="info">No results available</Alert>;
  }
  const handleButtonClick =
    (
      e: React.MouseEvent,
      callback?: (experiment: any) => void,
      experiment?: any
    ) => {
      e.stopPropagation();
      callback?.(experiment);
    };

    console.log("ExperimentsList rendered", experiments);

  return (
    <div className="d-flex flex-column">
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table
        bordered
        hover
        responsive
        className="experiments-table"
      >
        <thead>
          <tr>
            {(mode !== "template") && (
              <th className="status-column">Status</th>
            )}
            <th className="name-column">Name</th>
            <th className="description-column">Description</th>
            <th className="hypothesis-column">Hypothesis</th>
            <th className="labels-column">Labels</th>
            
            {(mode === "shared" || mode === "group") && (
              <th className="owner-column">Owner</th>
            )}
            {(mode !== "template") && (
              <th className="actions-column">Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {experiments.map((experiment, index) => (
            <tr
              key={experiment.id ?? index}
                className={`cursor-pointer ${
                (mode === "template" || mode==="archived") && selectedExperiment?.id === experiment.id? "selected-row": ""}`}
              onClick={() => {
                if (mode === "template" || mode === "archived") {
                  onExperimentSelect?.(experiment);
                } else {
                  onExperimentClick(experiment);
                }
              }}
            >
              {(mode !== "template") && (
                <td>{experiment.status}</td>
              )}
              <td>{experiment.name}</td>

              <td>
                <div className="clamped-content">
                  {experiment.description}
                </div>
              </td>

              <td>
                <div className="clamped-content">
                  {experiment.hypothesis}
                </div>
              </td>

              <td>
                <div className="clamped-content">
                  {experiment.labels?.join(", ")}
                </div>
              </td>

              {(mode === "shared" || mode === "group") && (
                <td>{experiment.userRole}</td>
              )}
              {mode !== "template" && (       
              <td className="actions-column">
                <div className="actions-container">
                  {experiment.userRole !== ExperimentRoleEnum.VIEWER && (
                  <Button 
                    variant="primary"
                    size="sm"
                    title="Edit experiment"
                    onClick={(e) =>
                      handleButtonClick(
                        e,
                        onExperimentEdit,
                        experiment
                      )
                    }
                  >
                    <PencilSquare />
                  </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) =>
                      handleButtonClick(
                        e,
                        onExperimentCopy,
                        experiment
                      )
                    }
                  >
                    <Copy />
                  </Button>

                  {(mode === "group" || mode === "user") && (
                    <Button
                      variant="primary"
                      size="sm"
                      title="Share experiment"
                      onClick={(e) =>
                        handleButtonClick(
                          e,
                          onExperimentShare,
                          experiment
                        )
                      }
                    >
                      <Share />
                    </Button>
                  )}
                  {mode === "archived" && (
                    <Button
                      variant="primary"
                      size="sm"
                      title="Restore experiment"
                      onClick={(e) => handleButtonClick(e, onExperimentRestore, experiment)}
                    >
                      < Archive />
                    </Button>
                  )}

                  {mode === "user" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        title="Archive experiment"
                        onClick={(e) =>
                          handleButtonClick(
                            e,
                            onExperimentArchive,
                            experiment
                          )
                        }
                      >
                        <Archive />
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        title="Delete experiment"
                        onClick={(e) =>
                          handleButtonClick(
                            e,
                            onExperimentDelete,
                            experiment
                          )
                        }
                      >
                        <Trash />
                      </Button>
                    </>
                  )}
                </div>
              </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}