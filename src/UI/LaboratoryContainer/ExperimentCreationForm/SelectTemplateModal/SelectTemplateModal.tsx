import {Tabs, Tab, Modal, Button, Spinner, Alert} from "react-bootstrap";
import { useEffect, useState } from "react";
import CancelButton from "../../../Buttons/CancelButton/CancelButton";
import { Experiment } from "../../../../Domain/Laboratory/Entities/Experiment";
import ExperimentList from "../../../LaboratoryContainer/ExperimentListContainer/ExperimentList/ExperimentList";
import { ExperimentFilter } from "../../../../Domain/Laboratory/Entities/ExperimentFilter";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { getTemplateExperiments, getTemplateBenchmarks } from "../../../../DataProvider/Services/experimentService";

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

    const onExperimentSelect = (experiment: Experiment) => {
        if (selectedTemplate?.id === experiment.id) {
            setSelectedTemplate(null);
        } else setSelectedTemplate(experiment);
    };

    const filteredTemplates = currentTemplates.filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase()));
    console.log("Current templates:", currentTemplates);
    console.log("Filtered templates:", filteredTemplates);

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
                            placeholder="Search metrics..."
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
            </Modal.Body>

            <Modal.Footer>
                {( selectedTemplate && (
                <>
                    <Button variant="info" onClick={() =>{ setSeeTemplateDetails(true); alert("Template details not implemented yet.");}}>
                        See Template Details
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
        {seeTemplateDetails && selectedTemplate && (
            //TODO: implement template details
            <div></div>
        )}
        </>
    );
}