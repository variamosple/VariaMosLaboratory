import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";

/**
 * GET /metrics/public
 */
export const getPublicMetrics = async () => {
    try {
        const { data } = await LABORATORY_CLIENT.get("/metrics/public");
        return data;
    } catch (error) {
        console.error("Error fetching public metrics:", error);
        throw error;
    }
};

/**
 * GET /metrics/user
 */
export const getUserMetrics = async () => {
    try {
        const { data } = await LABORATORY_CLIENT.get("/metrics/user");
        return data;
    } catch (error) {
        console.error("Error fetching user metrics:", error);
        throw error;
    }
}

/**
 * GET /metrics/:id
 */
export const getMetricById = async (id: string) => {
    try {
        const { data } = await LABORATORY_CLIENT.get(`/metrics/${id}`);
        return data;
    } catch (error) {
        console.error(`Error fetching metric with ID ${id}:`, error);
        throw error;
    }
};

/**
 * POST /metrics
 */
export const createMetric = async (metricData: any) => {
    try {
        const { data } = await LABORATORY_CLIENT.post("/metrics", metricData);
        return data;
    } catch (error) {
        console.error("Error creating metric:", error);
        throw error;
    }
};

/**
 * PUT /metrics/:id
 */
export const updateMetric = async (id: string, metricData: any) => {
    try {
        const { data } = await LABORATORY_CLIENT.put(`/metrics/${id}`, metricData);
        return data;
    } catch (error) {
        console.error(`Error updating metric with ID ${id}:`, error);
        throw error;
    }
};

/**
 * DELETE /metrics/:id
 */
export const deleteMetric = async (id: string) => {
    try {
        const { data } = await LABORATORY_CLIENT.delete(`/metrics/${id}`);
        return data;
    } catch (error) {
        console.error(`Error deleting metric with ID ${id}:`, error);
        throw error;
    }
};

/**
 * POST /metrics/publish
 */
export const publishMetrics = async (metricsToPublish: any[]) => {
    try {
        const publishPromises = metricsToPublish.map(metric => updateMetric(metric.id, { userId: null }));
        await Promise.all(publishPromises);
    } catch (error) {
        console.error("Error publishing metrics:", error);
        throw error;
    }
}