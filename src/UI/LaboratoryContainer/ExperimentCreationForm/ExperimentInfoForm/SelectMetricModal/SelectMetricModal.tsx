import { Metric } from "../../../../../Domain/Laboratory/Entities/Metric";
import { Modal, Tabs, Tab, Button, Alert, Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";
import CancelButton from "../../../../Buttons/CancelButton/CancelButton";
import MetricCard from "./MetricCard/MetricCard";
import "./SelectMetricModal.css";
import CreateMetricForm from "./CreateMetricForm/CreateMetricForm";
import ConfirmationModal from "../../../../ConfirmationModal/ConfirmationModal";
import * as alertify from "alertifyjs";
import { errorMessage } from "../../../../errorMessage";
import { getPublicMetrics, getUserMetrics, updateMetric, createMetric, deleteMetric, publishMetrics } from "../../../../../DataProvider/Services/metricService";

interface SelectMetricModalProps {
    show: boolean;
    onClose: () => void;
    setSelectedMetrics: React.Dispatch<React.SetStateAction<Metric[]>>;
    selectedMetrics: Metric[];
}

export default function SelectMetricModal({ show, onClose, setSelectedMetrics, selectedMetrics, }: SelectMetricModalProps) {
    const [activeTab, setActiveTab] = useState("MetricsCatalog");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const selectedCustomMetrics = selectedMetrics.filter((metric) => metric.userId!== null);
    const [selectedMetricsState, setSelectedMetricsState] = useState<Metric[]>(selectedCustomMetrics);
    const [publicMetrics, setPublicMetrics] = useState<Metric[]>([]);
    const [customMetrics, setCustomMetrics] = useState<Metric[]>([]);
    const [hasLoadedMetrics, setHasLoadedMetrics] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const currentMetrics = activeTab === "MetricsCatalog" ? publicMetrics : activeTab === "CustomMetrics" ? customMetrics : [];
    const filteredMetrics = currentMetrics.filter((metric) => metric.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const publishCustomMetrics = async () => { 
        const metricsToPublish = selectedMetricsState.filter(metric => metric.userId !== null);
        try {
            await publishMetrics(metricsToPublish);
            setCustomMetrics(prev =>prev.filter(custom =>!metricsToPublish.some(published => published.id === custom.id)));
            setPublicMetrics(prev => [
                ...prev,
                ...metricsToPublish.map(metric => ({
                    ...metric,
                    isCustom: false,
                })),
            ]);
            setShowModal(false);
        } catch (error) {
            console.error("Failed to publish metrics:", error);
        }
    };

    useEffect(() => {
        setSelectedMetricsState(selectedMetrics);
    }, [selectedMetrics]);

    const loadMetrics = async () => {
        setIsLoadingMetrics(true);
        setPublicMetrics(await getPublicMetrics());
        setCustomMetrics(await getUserMetrics());
        setIsLoadingMetrics(false);
        setHasLoadedMetrics(true);
    };

    useEffect(() => {
        if (!show || hasLoadedMetrics) {
            return;
        }
        loadMetrics()
    }, [show, hasLoadedMetrics]);

    const toggleMetric = (metric: Metric, checked: boolean ) => {
        // Selecting twice must not count a metric twice
        setSelectedMetricsState((prev) => checked
            ? (prev.some((m) => m.id === metric.id) ? prev : [...prev, metric])
            : prev.filter((m) => m.id !== metric.id));
    };

    const onCreate = async (newMetric: Metric) => {
        // The server gives the metric its id: only the metric it returns can be selected
        let created: Metric;
        try {
            created = await createMetric(newMetric);
        } catch (error) {
            alertify.error(errorMessage(error, "The metric could not be created."));
            return;
        }
        setCustomMetrics((prev) => [...prev, created]);
        setActiveTab("CustomMetrics");
        toggleMetric(created, true);
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
                        <Button variant="primary" className="mt-4" onClick={() => setShowModal(true)} disabled={selectedMetricsState.filter(metric => metric.userId !== null).length === 0}>
                            Publish Selected Custom Metrics{" "}
                                ({selectedMetricsState.filter(
                                    (selected) =>
                                        selectedMetricsState.filter(metric => metric.userId !== null).some((custom) => custom.id === selected.id)
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
                        setSelectedMetrics([
                        ...selectedMetricsState,
                        ]);                        
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