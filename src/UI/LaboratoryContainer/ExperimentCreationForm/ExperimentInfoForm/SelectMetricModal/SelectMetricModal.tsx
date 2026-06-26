import { Metric } from "../../../../../Domain/Laboratory/Entities/Metric";
import { Modal, Tabs, Tab, Button, Alert, Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";
import CancelButton from "../../../../Buttons/CancelButton/CancelButton";
import MetricCard from "./MetricCard/MetricCard";
import "./SelectMetricModal.css";
import CreateMetricForm from "./CreateMetricForm/CreateMetricForm";
import ConfirmationModal from "../../../../ConfirmationModal/ConfirmationModal";

interface SelectMetricModalProps {
    show: boolean;
    onClose: () => void;
    setSelectedMetrics: React.Dispatch<React.SetStateAction<Metric[]>>;
    selectedMetrics: Metric[];
    selectedCustomMetrics: Metric[];
    setSelectedCustomMetrics: React.Dispatch<React.SetStateAction<Metric[]>>;
}

export default function SelectMetricModal({ show, onClose, setSelectedMetrics, selectedMetrics, selectedCustomMetrics, setSelectedCustomMetrics }: SelectMetricModalProps) {
    const [activeTab, setActiveTab] = useState("MetricsCatalog");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const [metricsCatalog, setMetricsCatalog] = useState<Metric[]>([]);
    const [selectedMetricsState, setSelectedMetricsState] = useState<Metric[]>([]);
    const [selectedCustomMetricsState, setSelectedCustomMetricsState] = useState<Metric[]>([]);
    const currentMetrics = activeTab === "MetricsCatalog" ? metricsCatalog : activeTab === "CustomMetrics" ? selectedCustomMetricsState : [];
    const [hasLoadedMetrics, setHasLoadedMetrics] = useState(false);
    const filteredMetrics = currentMetrics.filter((metric) => metric.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const [showModal, setShowModal] = useState(false);

    const publishCustomMetrics = () => {
        const metricsToPublish = selectedCustomMetricsState.filter(custom =>
            selectedMetricsState.some(selected => selected.id === custom.id)
        );

        setMetricsCatalog(prev => [...prev, ...metricsToPublish]);

        setSelectedCustomMetricsState(prev =>
            prev.filter(
                custom =>
                    !metricsToPublish.some(
                        published => published.id === custom.id
                    )
            )
        );

        setShowModal(false);
    };

    useEffect(() => {
        setSelectedMetricsState(selectedMetrics);
    }, [selectedMetrics]);

    useEffect(() => {
        setSelectedCustomMetricsState(selectedCustomMetrics);
    }, [selectedCustomMetrics]);

    const loadMetrics = async () => {
        setIsLoadingMetrics(true);
        // Simulate loading metrics with a timeout
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoadingMetrics(false);
    };

    useEffect(() => {
        if (!show || hasLoadedMetrics) {
            return;
        }
        loadMetrics().then(() => {
            // Simulate loaded metrics
            setMetricsCatalog([
                { id: "1", name: "Metric 1", description: "Description for Metric 1", formula: "formula1", unit: "unit1" },
                { id: "2", name: "Metric 2", description: "Description longer for this metric, to see how it would look. It has multiple lines of text.", formula: "formula2", unit: "unit2" },
                { id: "3", name: "Metric 3", description: "Description for Metric 3", formula: "formula3", unit: "unit3" },
                { id: "4", name: "Metric 4", description: "Description for Metric 4", formula: "formula4", unit: "unit4" },
                { id: "5", name: "Metric 5", description: "Description for Metric 5", formula: "formula5", unit: "unit5" },
                { id: "6", name: "Metric 6", description: "Description for Metric 6", formula: "formula6", unit: "unit6" },
            ]);
            setHasLoadedMetrics(true);
        });
    }, [show, hasLoadedMetrics]);

    const toggleMetric = (metric: Metric, checked: boolean ) => {
        setSelectedMetricsState((prev) => checked ? [...prev, metric] : prev.filter((m) => m.id !== metric.id));
    };

    const onCreate = (newMetric: Metric) => {
        setSelectedCustomMetricsState((prev) => [...prev, newMetric]);
        setActiveTab("CustomMetrics");
        toggleMetric(newMetric, true);
    }

    return (
        <>
        <Modal show={show} onHide={onClose} size="xl" dialogClassName="custom-modal-height">
            <Modal.Header closeButton>
                <Modal.Title>
                    Select Metrics
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => k && setActiveTab(k)}
                        className="mb-0 flex-shrink-0"
                    >
                        <Tab eventKey="MetricsCatalog" title="Metrics Catalog" />
                        <Tab eventKey="CustomMetrics" title="Custom Metrics" />
                        <Tab eventKey="CreateMetric" title="Create Metric" />
                    </Tabs>

                    {activeTab !== "CreateMetric" && (
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search metrics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    )}
                </div>

                {isLoadingMetrics ? (
                    <div className="text-center py-5">
                        <Spinner animation="border"/>
                        <div className="mt-3">
                            Loading metrics...
                        </div>
                    </div>
                ) : filteredMetrics.length === 0 && activeTab !== "CreateMetric" ? (
                    <Alert variant="info">
                        {activeTab === "MetricsCatalog" ? "No metrics found in catalog." 
                        : "No custom metrics found. Create a custom metric in the 'Create Metric' tab to see it here."}
                    </Alert>
                ) : activeTab === "CreateMetric" ? (
                    <CreateMetricForm onCreate={onCreate} />
                ) : (
                    <>
                    <div className="metric-list">
                        {filteredMetrics.map((metric) => {
                            const selected = selectedMetricsState.some(
                                (m) => m.id === metric.id
                            );

                            return (
                                <MetricCard
                                    key={metric.id}
                                    metric={metric}
                                    selected={selected}
                                    onClick={() =>
                                        toggleMetric(metric, !selected)
                                    }
                                />
                            );
                        })}
                    </div>
                    {activeTab === "CustomMetrics" && (
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="primary" className="mt-4" onClick={() => setShowModal(true)} disabled={selectedCustomMetricsState.length === 0}>
                            Publish Selected Custom Metrics{" "}
                                ({selectedMetricsState.filter(
                                    (selected) =>
                                        selectedCustomMetricsState.some((custom) => custom.id === selected.id)
                                ).length})                        
                        </Button>
                    </div>
                    )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="primary"
                    onClick={() => {
                        setSelectedMetrics(selectedMetricsState);
                        setSelectedCustomMetrics(selectedCustomMetricsState);
                        onClose();
                    }}
                >
                    Apply {selectedMetricsState.length > 0 && `(${selectedMetricsState.length})`}
                </Button>
                <CancelButton onClick={() => {onClose(); setSelectedMetricsState(selectedMetrics);}}/>
                <Button 
                    variant="danger" 
                    onClick={() => {
                            setSelectedMetricsState([]); 
                            setSelectedMetrics([]);
                            setSelectedCustomMetricsState([]); 
                            setSelectedCustomMetrics([]);
                    }}
                    disabled={selectedMetricsState.length === 0}
                >
                    Clear
                </Button>
            </Modal.Footer>
        </Modal>

        <ConfirmationModal
            show={showModal}
            confirmButtonVariant={"primary"}
            message={"Are you sure you want to publish the selected custom metrics? This action cannot be undone and the metrics will become available in the Metrics Catalog for all users."}
            onConfirm={() => {
                setShowModal(false);
                publishCustomMetrics();
            }}
            onCancel={() => {
                setShowModal(false);
            }}
        />
        </>
    );
}