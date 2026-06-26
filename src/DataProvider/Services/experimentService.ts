import axios from "axios";
import {LABORATORY_CLIENT} from "../../Infraestructure/AxiosConfig";
import { ExperimentFilter } from "@domain/Laboratory/Entities/ExperimentFilter";
import { ResponseModel } from "@variamosple/variamos-components";
import { Experiment } from "@domain/Laboratory/Entities/Experiment";
import { ExperimentRoleEnum } from "@domain/Laboratory/Entities/Collaborator";
/**
 * Service for experiment management
 * Handles CRUD operations for experiments
 */

const fullExperiment =   {id: "12a50fb0-b7db-42e1-abb7-33b6cc8681b4",
  name: "Name of the experiment",
  description: "Description of the experiment, including its goals, scope, and any relevant background information that provides context for the experiment.",
  status: "draft",
  hypothesis: "Hypothesis of the experiment, stating the expected outcome or relationship between variables that the experiment aims to test.",
  scenarios: [
    {
      id: "38c0d747-d818-440e-af78-cc3cc7a79690",
      models: [
        {
          id: "247bb422-1f3a-42c1-b9ce-69830377fe1b",
          name: "TouristGuide",
          type: "Feature model with attributes",
          author: "Zhang, G., Ye, H., & Lin, Y. (2011)",
          description:
            'The feature model depicts a "Tourist Guide" system, highlighting features related to device connectivity, security...',
          constraints: "",
          elements: [],
          relationships: [],
          source:
            "Proceedings of the 6th International Conference on Software and Database Technologies, 249–254."
        }
      ],
      metrics: [],
      customMetrics: []
    }
  ],
  userId: "c61bd56a-ed34-44d1-b623-243ef58ef30e",
  labels: ["label1", "label2"],
  version: 1.0,
  operationalContext: undefined,
  solver_config: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now()
}

  export const getExperimentsByUser = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [fullExperiment, { name : "Sample Experiment", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper sagittis condimentum. Ut aliquam dolor a nisl elementum, ut molestie nisl sagittis. Phasellus risus sem, ullamcorper non egestas non, eleifend eget augue. Aenean placerat, diam non bibendum accumsan, erat augue imperdiet lectus, sit amet vestibulum lacus tortor sed ipsum. Donec auctor, felis a auctor lacinia, nisl sapien consequat felis, at sollicitudin turpis ante in lacus. Aliquam lorem arcu, pellentesque scelerisque metus ac, malesuada scelerisque orci. Ut porta, est a ullamcorper interdum, ex dolor venenatis turpis, nec dignissim neque ipsum eu mauris. Duis nunc velit, interdum quis ante quis, malesuada consectetur tortor. Vestibulum posuere libero et faucibus ultrices. Praesent elit tellus, mattis a tincidunt eget, condimentum vitae elit. Etiam vitae nisl leo. Nulla facilisi. Etiam a ex gravida, efficitur urna et, accumsan nibh. Nulla malesuada urna ac sem condimentum sollicitudin. ", hypothesis: "This is a sample hypothesis" }] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching experiments:", error);
      throw error;
    }
  }

  export const getSharedExperiments = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching shared experiments:", error);
      throw error;
    }
  }
  
  export const getGroupExperiments = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [{ name : "Sample Group Experiment"}] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching group experiments:", error);
      throw error;
    }
  }

  export const getTemplateExperiments = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [{id: "1", name : "Sample Template Experiment", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper sagittis condimentum. Ut aliquam dolor a nisl elementum, ut molestie nisl sagittis. Phasellus risus sem, ullamcorper non egestas non, eleifend eget augue. Aenean placerat, diam non bibendum accumsan, erat augue imperdiet lectus, sit amet vestibulum lacus tortor sed ipsum. Donec auctor, felis a auctor lacinia, nisl sapien consequat felis, at sollicitudin turpis ante in lacus. Aliquam lorem arcu, pellentesque scelerisque metus ac, malesuada scelerisque orci. Ut porta, est a ullamcorper interdum, ex dolor venenatis turpis, nec dignissim neque ipsum eu mauris. Duis nunc velit, interdum quis ante quis, malesuada consectetur tortor. Vestibulum posuere libero et faucibus ultrices. Praesent elit tellus, mattis a tincidunt eget, condimentum vitae elit.", hypothesis: "This is a sample template hypothesis" }] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching template experiments:", error);
      throw error;
    }
  }

  export const getTemplateBenchmarks = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [{id: "2", name : "Sample Template Benchmark", description: "description of a sample template benchmark", hypothesis: "This is a sample template benchmark hypothesis" }, {id: "3", name : "Another Template Benchmark", description: "Another description", hypothesis: "Another hypothesis" }] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching template benchmarks:", error);
      throw error;
    }
  }

  export const getArchivedExperiments = async (filter: ExperimentFilter): Promise<ResponseModel<Experiment[]>> => {
    try {
      //TODO
      return { data: [{ id: "4", name : "Sample Archived Experiment", status: "archived"}, { id: "5", name : "Another Archived Experiment", status: "archived"}] } as ResponseModel<Experiment[]>;
    } catch (error) {
      console.error("Error fetching archived experiments:", error);
      throw error;
    }
  }

  export const getExperiment = async (experimentId: string): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error fetching experiment:", error);
      throw error;
    }
  }

  export const archiveExperiment = async (experimentId: string): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error archiving experiment:", error);
      throw error;
    }
  }

  export const restoreExperiment = async (experimentId: string): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error restoring experiment:", error);
      throw error;
    }
  }

  export const copyExperiment = async (experimentId: string): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error copying experiment:", error);
      throw error;
    }
  }

  export const shareExperiment = async (experimentId: string, userEmail: string, role: ExperimentRoleEnum): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error sharing experiment:", error);
      throw error;
    }
  }

  export const createExperiment = async (experimentData: any): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error creating experiment:", error);
      throw error;
    }
  }

  export const updateExperiment = async (experimentId: string, experimentData: any): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error updating experiment:", error);
      throw error;
    }
  }

  export const deleteExperiment = async (experimentId: string): Promise<any> => {
    try {
      //TODO
    } catch (error) {
      console.error("Error deleting experiment:", error);
      throw error;
    }
  }



  export const getExperimentAuthor = async (experimentId: string): Promise<string> => {
    try {
      //TODO
      return "Experiment Author"; 
    } catch (error) {
      console.error("Error fetching experiment info:", error);
      throw error;
    }
  }


