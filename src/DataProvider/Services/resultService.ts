import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { ExportFormat, Results, SolverBenchmark } from "../../Domain/Laboratory/Entities/Results";

/** ?runId=a&runId=b; no parameter means every run of the experiment. */
const runParams = (runIds: string[]) => {
  const params = new URLSearchParams();
  runIds.forEach((id) => params.append("runId", id));
  return params;
};

/** GET /experiments/{id}/results (LAB-MT-04, LAB-VIS-02) */
export const getResults = async (experimentId: string, runIds: string[] = []): Promise<Results> => {
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/results`, { params: runParams(runIds) });
  return response.data;
};

/** GET /experiments/{id}/benchmark (LAB-MT-06) */
export const getBenchmark = async (experimentId: string, runIds: string[] = []): Promise<SolverBenchmark[]> => {
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/benchmark`, { params: runParams(runIds) });
  return response.data;
};

/** GET /experiments/{id}/export (LAB-MT-05): the file and the name the server gives it. */
export const exportResults = async (experimentId: string, format: ExportFormat, runIds: string[] = []): Promise<{ blob: Blob; fileName: string }> => {
  const params = runParams(runIds);
  params.set("format", format);
  const response = await LABORATORY_CLIENT.get(`/experiments/${experimentId}/export`, { params, responseType: "blob" });
  const disposition: string = response.headers?.["content-disposition"] ?? "";
  const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `results.${format}`;
  return { blob: response.data, fileName };
};

/** Hands a file to the browser as a download. */
export const saveFile = ({ blob, fileName }: { blob: Blob; fileName: string }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
