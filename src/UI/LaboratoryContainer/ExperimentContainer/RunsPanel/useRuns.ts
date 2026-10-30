import { useCallback, useEffect, useRef, useState } from "react";
import { getRuns } from "../../../../DataProvider/Services/runService";
import { Run, isActiveRun } from "../../../../Domain/Laboratory/Entities/Run";

const POLL_INTERVAL_MS = 1000;

/**
 * The runs of an experiment. While one is pending or running, they are read
 * again every second (LAB-RUN-03); `onRunFinished` is called once for each run
 * that ends while the page follows it.
 */
export function useRuns(experimentId: string, onRunFinished: (run: Run) => void) {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loaded, setLoaded] = useState(false);
    const active = useRef(new Set<string>());
    // The latest callback, without restarting the polling when it changes
    const finished = useRef(onRunFinished);
    finished.current = onRunFinished;

    const reload = useCallback(async () => {
        try {
            const next = await getRuns(experimentId);
            next.forEach((run) => {
                if (isActiveRun(run.status)) {
                    active.current.add(run.id);
                } else if (active.current.delete(run.id)) {
                    finished.current(run);
                }
            });
            setRuns(next);
        } catch (error) {
            console.error("Error fetching the runs:", error);
        } finally {
            setLoaded(true);
        }
    }, [experimentId]);

    useEffect(() => {
        active.current.clear();
        setLoaded(false);
        reload();
    }, [reload]);

    const hasActiveRun = runs.some((run) => isActiveRun(run.status));

    useEffect(() => {
        if (!hasActiveRun) return;
        const timer = setInterval(reload, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [hasActiveRun, reload]);

    return { runs, loaded, reload, activeRun: runs.find((run) => isActiveRun(run.status)) ?? null };
}
