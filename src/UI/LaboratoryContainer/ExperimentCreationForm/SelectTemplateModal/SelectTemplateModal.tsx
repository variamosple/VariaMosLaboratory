import {Tabs, Tab, Modal, Button, Spinner, Alert} from "react-bootstrap";
import { useEffect, useState } from "react";
import CancelButton from "../../../Buttons/CancelButton/CancelButton";
import { Experiment, ExperimentDetailed } from "../../../../Domain/Laboratory/Entities/Experiment";
import ExperimentList from "../../../LaboratoryContainer/ExperimentListContainer/ExperimentList/ExperimentList";
import { ExperimentFilter } from "../../../../Domain/Laboratory/Entities/ExperimentFilter";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { getTemplateExperiments, getTemplateBenchmarks, getExperimentDetailed } from "../../../../DataProvider/Services/experimentService";
import { errorMessage } from "../../../errorMessage";

type SelectTemplateModalProps = {
    show: boolean;
    onClose: () => void;
    onTemplateSelected: (template: Experiment) => void;
};

export default function SelectTemplateModal({ show, onClose, onTemplateSelected }: SelectTemplateModalProps) {
    const [activeTab, setActiveTab] = useState("Experiments");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<Experiment | null>(null);
    const [seeTemplateDetails, setSeeTemplateDetails] = useState(false);
    const [details, setDetails] = useState<ExperimentDetailed | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const queryFunction = activeTab === "Experiments" ? getTemplateExperiments: getTemplateBenchmarks;

    const {
        data: currentTemplates = [],
        loadData: loadExperiments,
        isLoading,
        currentPage,
        onPageChange,
        totalPages,
        filter: experimentsFilter,
        } = usePaginatedQuery<ExperimentFilter, Experiment>({
        queryFunction,
        initialFilter: new ExperimentFilter(),
        });

    useEffect(() => {
        if (!show) return;

        setSelectedTemplate(null);

        loadExperiments(new ExperimentFilter());
    }, [activeTab]);

    // LAB-CF-05: what the selected template holds, before applying it
    useEffect(() => {
        setDetails(null);
        setDetailsError(null);
        if (!seeTemplateDetails || !selectedTemplate) return;
        getExperimentDetailed(selectedTemplate.id)
            .then(setDetails)
            .catch((error) => setDetailsError(errorMessage(error, "The details of the template could not be loaded.")));
    }, [seeTemplateDetails, selectedTemplate]);

    const onExperimentSelect = (experiment: Experiment) => {
        if (selectedTemplate?.id === experiment.id) {
            setSelectedTemplate(null);
        } else setSelectedTemplate(experiment);
    };

    const filteredTemplates = currentTemplates.filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const onSubmit = (name: string) => {
        loadExperiments(
        Object.assign(
            new ExperimentFilter(), 
            {
            ...experimentsFilter,
            name,
            pageNumber: 1,
            }
        )
        );
    };

    return (
    <>
        <Modal show={show} onHide={onClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    Select Template
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => {k && setActiveTab(k); setSearchTerm(""); }}
                        className="mb-0 flex-shrink-0"
                    >
                        <Tab eventKey="Experiments" title="Experiments" />
                        <Tab eventKey="Benchmarks" title="Benchmarks" />
                    </Tabs>

                    {activeTab !== "CreateMetric" && (
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search templates..."
                            aria-label="Search templates"
                            value={searchTerm}
                            onChange={(e) =>{ setSearchTerm(e.target.value); onSubmit(e.target.value)}}
                        />
                    )}
                </div>
                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border"/>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-5">
                        <Alert variant="info">No templates found.</Alert>
                    </div>
                ) : (
                    <ExperimentList
                        experiments={filteredTemplates}
                        onExperimentClick={() => {}}
                        mode="template"
                        currentPage={currentPage}
                        onPageChange={onPageChange}
                        totalPages={totalPages}
                        selectedExperiment={selectedTemplate}
                        onExperimentSelect={onExperimentSelect}
                    />
                )}
                {seeTemplateDetails && selectedTemplate && (
                    <section className="border rounded p-3 mt-3" aria-label="Template details">
                        {detailsError ? (
                            <Alert variant="danger" className="mb-0">{detailsError}</Alert>
                        ) : !details ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            <>
                                <h6>{details.name}</h6>
                                {details.description && <p className="small mb-2">{details.description}</p>}
                                {details.hypothesis && <p className="small mb-2"><strong>Hypothesis:</strong> {details.hypothesis}</p>}
                                <p className="small mb-1"><strong>Scenarios:</strong></p>
                                <ul className="small mb-2">
                                    {details.scenarios.map((scenario, index) => (
                                        <li key={scenario.id}>
                                            {scenario.name || `Scenario ${index + 1}`}: {Object.keys(scenario.solverConfigs ?? {}).join(", ") || "no solver"}
                                            {scenario.models.length > 0 && `, ${scenario.models.length} model(s)`}
                                        </li>
                                    ))}
                                </ul>
                                <p className="small mb-0">
                                    <strong>Metrics:</strong> {details.metrics.map((metric) => metric.name).join(", ") || "none"}
                                </p>
                            </>
                        )}
                    </section>
                )}
            </Modal.Body>

            <Modal.Footer>
                {( selectedTemplate && (
                <>
                    <Button variant="info" onClick={() => setSeeTemplateDetails((shown) => !shown)}>
                        {seeTemplateDetails ? "Hide Template Details" : "See Template Details"}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onTemplateSelected(selectedTemplate!);
                            onClose();
                        }}
                        disabled={!selectedTemplate}
                    >
                        Apply Template
                    </Button>
                </>
                ))}
                <CancelButton onClick={() => {onClose();}}/>
            </Modal.Footer>
        </Modal>
        </>
    );
}