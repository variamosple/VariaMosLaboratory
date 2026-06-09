import axios from "axios";
import {LABORATORY_CLIENT} from "../../Infraestructure/AxiosConfig";

/**
 * Service for experiment management
 * Handles CRUD operations for experiments
 */
export class ExperimentService {
  async getExperimentsByUser(userId: string): Promise<any> {
    try {
      //TODO
    } catch (error) {
      console.error("Error fetching experiments:", error);
      throw error;
    }
  }

  async getExperiment(experimentId: string): Promise<any> {
    try {
      //TODO
    } catch (error) {
      console.error("Error fetching experiment:", error);
      throw error;
    }
  }

  async createExperiment(experimentData: any): Promise<any> {
    try {
      //TODO
    } catch (error) {
      console.error("Error creating experiment:", error);
      throw error;
    }
  }

  async updateExperiment(experimentId: string, experimentData: any): Promise<any> {
    try {
      //TODO
    } catch (error) {
      console.error("Error updating experiment:", error);
      throw error;
    }
  }

  async deleteExperiment(experimentId: string): Promise<void> {
    try {
      //TODO
    } catch (error) {
      console.error("Error deleting experiment:", error);
      throw error;
    }
  }
}

export default new ExperimentService();
