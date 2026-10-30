import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { Run, RunComparison, RunReference } from "../../Domain/Laboratory/Entities/Run";
import { ExperimentDetailed } from "../../Domain/Laboratory/Entities/Experiment";

/**
 * POST /experiments/{experimentId}/runs
 * LAB-RUN-01: starts a run of a Ready experiment; it executes in the background.
 * A 400 lists the configuration problems in `details`.
 */
export const startRun = async (experimentId: string): Promise<Run> => {
  const response = await LABORATORY_CLIENT.post(`/experiments/${experimentId}/runs`);
  return response.data;
};

/** GET /experiments/{experimentId}/runs: newest first. */
export const getRuns = async (experimentId: string): Promise<Run[]> => {
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/runs`);
  return response.data;
};

/** GET /experiments/{experimentId}/runs/{runId}: with provenance and attempts (LAB-RP-02). */
export const getRun = async (experimentId: string, runId: string): Promise<Run> => {
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/runs/${runId}`);
  return response.data;
};

/** POST /experiments/{experimentId}/runs/{runId}/cancel (LAB-RUN-04). */
export const cancelRun = async (experimentId: string, runId: string): Promise<Run> => {
  const response = await LABORATORY_CLIENT.post(`/experiments/${experimentId}/runs/${runId}/cancel`);
  return response.data;
};

/** GET /experiments/{experimentId}/runs/{runId}/package (LAB-RP-01): the ZIP file. */
export const getRunPackage = async (experimentId: string, runId: string): Promise<{ blob: Blob; fileName: string }> => {
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/runs/${runId}/package`, { responseType: "blob" });
  const disposition: string = response.headers?.["content-disposition"] ?? "";
  return { blob: response.data, fileName: /filename="([^"]+)"/.exec(disposition)?.[1] ?? "package.zip" };
};

/** GET /runs/{persistentId} (LAB-RP-03) */
export const resolveRun = async (persistentId: string): Promise<RunReference> => {
  const response = await LABORATORY_CLIENT.get(`/runs/${encodeURIComponent(persistentId)}`);
  return response.data;
};

/** GET /runs/compare (LAB-RP-04): run ids or persistent ids. */
export const compareRuns = async (references: string[]): Promise<RunComparison> => {
  const params = new URLSearchParams();
  references.forEach((reference) => params.append("runId", reference));
  const response = await LABORATORY_CLIENT.get("/runs/compare", { params });
  return response.data;
};

/** POST /reproductions (LAB-RP-01): the experiment rebuilt from a package, Ready to run. */
export const reproduceFromPackage = async (file: Blob, projectId: string): Promise<{ experiment: ExperimentDetailed; metricsLeftOut: string[] }> => {
  const response = await LABORATORY_CLIENT.post("/reproductions", file, {
    params: { projectId },
    headers: { "Content-Type": "application/zip" },
  });
  return response.data;
};

/** LAB-RP-03: the permanent link of a run in this interface. */
export const permanentLink = (persistentId: string) =>
  `${window.location.origin}${window.location.pathname}#/runs/${persistentId}`;
