import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { CommentTargetType, ExperimentComment } from "../../Domain/Laboratory/Entities/Comment";

/** LAB-COL-03: comments of an experiment, oldest first. */
export const getComments = async (experimentId: string): Promise<ExperimentComment[]> =>
  (await LABORATORY_CLIENT.get(`/experiments/${experimentId}/comments`)).data;

export const addComment = async (
  experimentId: string,
  comment: { targetType: CommentTargetType; targetId: string; metricId?: string | null; body: string }
): Promise<ExperimentComment> => (await LABORATORY_CLIENT.post(`/experiments/${experimentId}/comments`, comment)).data;

export const editComment = async (experimentId: string, commentId: string, body: string): Promise<ExperimentComment> =>
  (await LABORATORY_CLIENT.put(`/experiments/${experimentId}/comments/${commentId}`, { body })).data;

export const deleteComment = async (experimentId: string, commentId: string): Promise<ExperimentComment> =>
  (await LABORATORY_CLIENT.delete(`/experiments/${experimentId}/comments/${commentId}`)).data;
