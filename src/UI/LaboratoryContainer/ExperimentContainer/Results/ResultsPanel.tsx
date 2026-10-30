import { useState } from "react";
import { Button, Tab, Tabs } from "react-bootstrap";
import * as alertify from "alertifyjs";
import { exportResults, saveFile } from "../../../../DataProvider/Services/resultService";
import { Run } from "../../../../Domain/Laboratory/Entities/Run";
import { ExportFormat } from "../../../../Domain/Laboratory/Entities/Results";
import { errorMessage } from "../../../errorMessage";
import DashboardTab from "./DashboardTab";
import CompareTab from "./CompareTab";
import BenchmarkTab from "./BenchmarkTab";
import SideBySideTab from "./SideBySideTab";
import "./Results.css";

type ResultsPanelProps = {
    experimentId: string;
    runs: Run[];
    tab: string;
    onTabChange: (tab: string) => void;
};

/** P3: dashboard (LAB-VIS-01), comparison and charts (LAB-MT-04, LAB-VIS-02), benchmark (LAB-MT-06), export (LAB-MT-05). */
export default function ResultsPanel({ experimentId, runs, tab, onTabChange }: ResultsPanelProps) {
    const [exporting, setExporting] = useState<ExportFormat | null>(null);
    // Comparison and benchmark load again when a run ends
    const refreshKey = runs.map((run) => `${run.id}:${run.status}`).join(",");

    const download = async (format: ExportFormat) => {
        setExporting(format);
        try {
            saveFile(await exportResults(experimentId, format));
        } catch (error) {
            alertify.error(errorMessage(error, "The results could not be exported."));
        } finally {
            setExporting(null);
        }
    };

    return (
        <section className="experiment-card mt-4 lab-results" aria-labelledby="results-title" id="results">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <h5 id="results-title" className="mb-0">Results</h5>
                <div className="d-flex gap-2 align-items-center">
                    <span className="small text-muted">Export all runs:</span>
                    {(["csv", "json", "xlsx"] as ExportFormat[]).map((format) => (
                        <Button key={format} size="sm" variant="outline-primary" disabled={runs.length === 0 || exporting !== null} onClick={() => download(format)}>
                            {format.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </div>
            <Tabs activeKey={tab} onSelect={(key) => key && onTabChange(key)} className="mb-3" mountOnEnter>
                <Tab eventKey="dashboard" title="Dashboard">
                    <DashboardTab run={runs[0] ?? null} />
                </Tab>
                <Tab eventKey="compare" title="Compare">
                    <CompareTab experimentId={experimentId} runs={runs} key={refreshKey} />
                </Tab>
                <Tab eventKey="benchmark" title="Solver benchmark">
                    <BenchmarkTab experimentId={experimentId} refreshKey={refreshKey} />
                </Tab>
                <Tab eventKey="sideBySide" title="Runs side by side">
                    <SideBySideTab runs={runs} />
                </Tab>
            </Tabs>
        </section>
    );
}
