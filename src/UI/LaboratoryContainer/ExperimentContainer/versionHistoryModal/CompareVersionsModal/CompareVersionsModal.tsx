import { useEffect, useState } from "react";
import { Modal, Button, Card, Badge } from "react-bootstrap";
import { ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";

interface CompareVersionsModalProps {
  show: boolean;
  onHide: () => void;
  experimentId: string;
  leftVersion: number;
  rightVersion: number;
  getExperimentVersion: (
    experimentId: string,
    version: number
  ) => Promise<ExperimentDetailed>;
}

const isEmptyScenario = (
  scenario: ExperimentDetailed["scenarios"][number]
) =>
  !scenario.modelId &&
  (!scenario.solverConfigs ||
    Object.keys(scenario.solverConfigs).length === 0);

const scenarioSignature = (
  scenario: ExperimentDetailed["scenarios"][number]
) =>
  JSON.stringify({
    modelId: scenario.modelId ?? null,
    solverConfigs: isEmptyScenario(scenario)
      ? null
      : scenario.solverConfigs,
  });

const scenarioExists = (
  scenario: ExperimentDetailed["scenarios"][number],
  otherScenarios: ExperimentDetailed["scenarios"]
) =>
  otherScenarios.some(
    other =>
      scenarioSignature(other) ===
      scenarioSignature(scenario)
  );

  const ScenarioCard = ({
  scenario,
  status,
}: {
  scenario: ExperimentDetailed["scenarios"][number];
  status?: "added" | "removed";
}) => (
  <Card
    className={`mb-3 shadow-sm border`}
  >
    <Card.Body>
      <div className="d-flex justify-content-between mb-2">
        <strong>Scenario</strong>

        {status === "added" && (
          <Badge bg="success">
            Added
          </Badge>
        )}

        {status === "removed" && (
          <Badge bg="danger">
            Removed
          </Badge>
        )}
      </div>

      <div className="mb-2">
        <strong>Model:</strong>{" "}
        {scenario.modelId ?? (
          <span className="text-muted">
            No model selected
          </span>
        )}
      </div>

      <div>
        <strong>Configuration:</strong>
      </div>

      {scenario.solverConfigs &&
      Object.keys(scenario.solverConfigs).length > 0 ? (
        <pre className="small bg-light border rounded p-2 mt-2">
          {JSON.stringify(
            scenario.solverConfigs,
            null,
            2
          )}
        </pre>
      ) : (
        <div className="text-muted mt-2">
          No configuration defined
        </div>
      )}
    </Card.Body>
  </Card>
);

const CompareVersionsModal = ({
  show,
  onHide,
  experimentId,
  leftVersion,
  rightVersion,
  getExperimentVersion,
}: CompareVersionsModalProps) => {

  const [left, setLeft] = useState<ExperimentDetailed>();
  const [right, setRight] = useState<ExperimentDetailed>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;

    const load = async () => {
      setLoading(true);

      try {
        const [leftData, rightData] = await Promise.all([
          getExperimentVersion(experimentId, leftVersion),
          getExperimentVersion(experimentId, rightVersion),
        ]);

        setLeft(leftData);
        setRight(rightData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [show, experimentId, leftVersion, rightVersion, getExperimentVersion]);


  const hasValue = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  };

  const different = (a: unknown, b: unknown) => {
    return JSON.stringify(a) !== JSON.stringify(b);
  };

  const CompareField = ({
  title,
  value,
  modified,
}: {
  title: string;
  value: React.ReactNode;
  modified: boolean;
}) => {

  if (!hasValue(value)) {
    return null;
  }

  return (
    <Card
      className={`mb-3 border`}
    >
      <Card.Body>

        <div className="d-flex justify-content-between mb-2">
          <strong>{title}</strong>

          {modified && (
            <Badge bg="warning" text="dark">
              Modified
            </Badge>
          )}
        </div>

        <div
          className={
            modified
              ? "bg-warning-subtle rounded p-2"
              : ""
          }
        >
          {value}
        </div>

      </Card.Body>
    </Card>
  );
};

  const renderMetrics = (
    metrics: any[],
    otherMetrics: any[],
    color: "danger" | "success"
  ) => (
    metrics.length
      ? metrics.map(metric => (
          <Badge
            key={metric.id}
            bg={otherMetrics.some(m => m.id === metric.id) ? "secondary" : color}
            className="me-2"
          >
            {metric.name}
          </Badge>
        ))
      : <span className="text-muted">No metrics</span>
  );

  const renderScenarios = (
    scenarios: ExperimentDetailed["scenarios"] = [],
    otherScenarios: ExperimentDetailed["scenarios"] = [],
    currentVersion: number
  ) => {
    if (!scenarios.length) {
      return <span className="text-muted">No scenarios</span>;
    }

    const newestVersion = Math.max(leftVersion, rightVersion);

    return scenarios.map(scenario => (
      <ScenarioCard
        key={scenario.id}
        scenario={scenario}
        status={
          scenarioExists(scenario, otherScenarios)
            ? undefined
            : currentVersion === newestVersion
              ? "added"
              : "removed"
        }
      />
    ));
  };

  if (!show) return null;


  return (
    <Modal show={show} onHide={onHide} size="xl">

      <Modal.Header closeButton>
        <Modal.Title>
          Compare Versions
        </Modal.Title>
      </Modal.Header>


      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>

        {!loading && left && right && (

          <div className="row">

            <div className="col-6 border-end">
              <h5 className="mb-3 text-center">Version {leftVersion}</h5>

              <CompareField
                title="Title"
                value={left.name}
                modified={different(left.name, right.name)}
              />

              <CompareField
                title="Description"
                value={left.description}
                modified={different(
                  left.description,
                  right.description
                )}
              />

              <CompareField
                title="Hypothesis"
                value={left.hypothesis}
                modified={different(
                  left.hypothesis,
                  right.hypothesis
                )}
              />

              <CompareField
                title="Labels"
                value={left.labels?.join(", ")}
                modified={different(
                  left.labels,
                  right.labels
                )}
              />


              <Card className="mb-3 border shadow-sm">
                <Card.Header>Metrics</Card.Header>
                <Card.Body>
                  {renderMetrics(left.metrics ?? [], right.metrics ?? [], "danger")}
                </Card.Body>
              </Card>


              <Card className="border shadow-sm">
                <Card.Header>Scenarios</Card.Header>
                <Card.Body>
                  {renderScenarios(left.scenarios ?? [], right.scenarios ?? [], leftVersion)}
                </Card.Body>
              </Card>
            </div>



            <div className="col-6">
              <h5 className="mb-3 text-center">Version {rightVersion}</h5>

              <CompareField
                title="Title"
                value={right.name}
                modified={different(left.name, right.name)}
              />

              <CompareField
                title="Description"
                value={right.description}
                modified={different(
                  left.description,
                  right.description
                )}
              />

              <CompareField
                title="Hypothesis"
                value={right.hypothesis}
                modified={different(
                  left.hypothesis,
                  right.hypothesis
                )}
              />

              <CompareField
                title="Labels"
                value={right.labels?.join(", ")}
                modified={different(
                  left.labels,
                  right.labels
                )}
              />

              <Card className="mb-3 border shadow-sm">
                <Card.Header>Metrics</Card.Header>
                <Card.Body>
                  {renderMetrics(right.metrics ?? [], left.metrics ?? [], "success")}
                </Card.Body>
              </Card>


              <Card className="border shadow-sm">
                <Card.Header>Scenarios</Card.Header>
                <Card.Body>
                  {renderScenarios(
                    right.scenarios ?? [],
                    left.scenarios ?? [],
                    rightVersion
                  )}                
                </Card.Body>
              </Card>

            </div>

          </div>

        )}

      </Modal.Body>


      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>

    </Modal>
  );
};


export default CompareVersionsModal;