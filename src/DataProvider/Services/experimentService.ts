import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { ExperimentFilter } from "@domain/Laboratory/Entities/ExperimentFilter";
import { ResponseModel } from "@variamosple/variamos-components";
import { Experiment, ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";
import { ExperimentRoleEnum } from "@domain/Laboratory/Entities/Collaborator";
import { ExperimentHistory } from "@domain/Laboratory/Entities/ExperimentHistory";
import { Collaborator } from "@domain/Laboratory/Entities/Collaborator";

const buildParams = (filter?: ExperimentFilter) => {
  if (!filter) return {};

  return {
    userId: filter.userId,
    name: filter.name,
    pageNumber: filter.pageNumber,
    pageSize: filter.pageSize,
  };
};

/**
 * GET /experiments (owner)
 */
export const getUserExperiments = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments",
      { params: buildParams(filter) }
    );
    return data;
  } catch (error) {
    console.error("Error fetching user experiments:", error);
    throw error;
  }
};

/**
 * GET /experiments/shared
 */
export const getSharedExperiments = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments/shared",
      { params: buildParams(filter) }
    );

    return data;
  } catch (error) {
    console.error("Error fetching shared experiments:", error);
    throw error;
  }
};

/**
 * GET /experiments/groups
 */
export const getGroupExperiments = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments/groups",
      { params: buildParams(filter) }
    );

    return data;
  } catch (error) {
    console.error("Error fetching group experiments:", error);
    throw error;
  }
};

/**
 * GET /experiments/templates
 */
export const getTemplateExperiments = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments/templates",
      { params: buildParams(filter) }
    );

    return data;
  } catch (error) {
    console.error("Error fetching template experiments:", error);
    throw error;
  }
};

/**
 * GET /experiments/benchmarks
 */
export const getTemplateBenchmarks = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments/benchmarks",
      { params: buildParams(filter) }
    );

    return data;
  } catch (error) {
    console.error("Error fetching template benchmarks:", error);
    throw error;
  }
};

/**
 * GET /experiments/archived
 */
export const getArchivedExperiments = async (
  filter: ExperimentFilter
): Promise<ResponseModel<Experiment[]>> => {
  try {
    const { data } = await LABORATORY_CLIENT.get(
      "/experiments/archived",
      { params: buildParams(filter) }
    );

    return data;
  } catch (error) {
    console.error("Error fetching archived experiments:", error);
    throw error;
  }
};

/**
 * GET /experiments/{experimentId}/detailed
 */
export const getExperimentDetailed = async (
  experimentId: string
): Promise<ExperimentDetailed> => {
  try {
    const response = await LABORATORY_CLIENT.get(
      `/experiments/${experimentId}/detailed`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching experiment:", error);
    throw error;
  }
};

/**
 * PUT /experiments/{experimentId}/archive
 */
export const archiveExperiment = async (
  experimentId: string
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.put(
      `/experiments/${experimentId}/archive`
    );

    return response.data;
  } catch (error) {
    console.error("Error archiving experiment:", error);
    throw error;
  }
};

/**
 * PUT /experiments/{experimentId}/restore
 */
export const restoreExperiment = async (
  experimentId: string
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.put(
      `/experiments/${experimentId}/restore`
    );

    return response.data;
  } catch (error) {
    console.error("Error restoring experiment:", error);
    throw error;
  }
};

/**
 * POST /experiments/{experimentId}/copy
 */
export const copyExperiment = async (
  experimentId: string
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      `/experiments/${experimentId}/copy`
    );

    return response.data;
  } catch (error) {
    console.error("Error copying experiment:", error);
    throw error;
  }
};

/**
 * POST /experiments/{experimentId}/share
 */
export const shareExperiment = async (
  experimentId: string,
  userEmail: string,
  role: ExperimentRoleEnum
): Promise<ResponseModel<any>> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      `/experiments/${experimentId}/share`,
      {
        userEmail,
        role,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error sharing experiment:", error);
    throw error;
  }
};

/**
 * POST /experiments
 */
export const createExperiment = async (
  experimentData: any
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      "/experiments",
      experimentData
    );

    return response.data;
  } catch (error) {
    console.error("Error creating experiment:", error);
    throw error;
  }
};

/**
 * PUT /experiments/{experimentId}
 */
export const updateExperiment = async (
  experimentData: ExperimentDetailed
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.put(
      `/experiments/${experimentData.id}`,
      experimentData
    );

    return response.data;
  } catch (error) {
    console.error("Error updating experiment:", error);
    throw error;
  }
};

/**
 * DELETE /experiments/{experimentId}
 */
export const deleteExperiment = async (
  experimentId: string
): Promise<ResponseModel<any>> => {
  try {
    const response = await LABORATORY_CLIENT.delete(
      `/experiments/${experimentId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting experiment:", error);
    throw error;
  }
};

/**
 * POST /experiments/{experimentId}/publish/template
 */
export const publishAsTemplate = async (
  experimentId: string
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      `/experiments/${experimentId}/publish/template`
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing experiment as template:", error);
    throw error;
  }
};

/**
 * POST /experiments/{experimentId}/publish/benchmark
 */
export const publishAsBenchmark = async (
  experimentId: string
): Promise<ResponseModel<ExperimentDetailed>> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      `/experiments/${experimentId}/publish/benchmark`
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing experiment as benchmark:", error);
    throw error;
  }
};

/**
 * GET /experiments/{experimentId}/history
 */
export const getExperimentHistory = async (
  experimentId: string
): Promise<ExperimentHistory[]> => {
  try {
    const response = await LABORATORY_CLIENT.get(
      `/experiments/${experimentId}/history`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching experiment history:", error);
    throw error;
  } 
}

/**
 * GET /experiments/{experimentId}/version/{version}
 */
export const getExperimentVersion = async (
  experimentId: string,
  version: number
): Promise<ExperimentDetailed> => {
  try {
    const response = await LABORATORY_CLIENT.get(
      `/experiments/${experimentId}/version/${version}`
    );
    return response.data;
  }
  catch (error) {
    console.error("Error fetching experiment version:", error);
    throw error;
  }
}

/**
 * POST /experiments/{experimentId}/version/{version}/restore
 */
export const restoreExperimentVersion = async (
  experimentId: string,
  version: number
): Promise<ExperimentDetailed> => {
  try {
    const response = await LABORATORY_CLIENT.post(
      `/experiments/${experimentId}/version/${version}/restore`
    );
    return response.data;
  } catch (error) {
    console.error("Error restoring experiment version:", error);
    throw error;
  }
}

/**
 * GET /experiments/{experimentId}/collaborators
 */
export const getCollaborators = async (
  experimentId: string
): Promise<Collaborator[]> => {
  try {
    const response = await LABORATORY_CLIENT.get(
      `/experiments/${experimentId}/collaborators`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    throw error;
  }
};

/**
 * DELETE /experiments/{experimentId}/collaborators/{collaboratorId}
 */
export const removeCollaborator = async (
  experimentId: string,
  collaboratorId: string
): Promise<any> => {
  try {
    const response = await LABORATORY_CLIENT.delete(
      `/experiments/${experimentId}/collaborators/${collaboratorId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing collaborator:", error);
    throw error;
  }
};
