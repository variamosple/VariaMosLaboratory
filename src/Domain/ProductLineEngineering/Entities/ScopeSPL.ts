import { Model } from "./Model";

export type Priority = "Low" | "Medium" | "High";

export interface Capability {
  name: string;
  isMandatory: boolean;
  importance: number; // Scale (for example, 1 to 5)
}

export class ScopeSPL {
  // Existing data
  models: Model[] = [];
  languagesAllowed: string[] = [];

  // Basic strategic information
  lineName: string = "";                // Name of the product line
  definition: string = "";              // Short description or definition
  purpose: string = "";                 // Purpose or mission
  strategicObjectives: string = "";   // Strategic objectives (list or array of sentences)

  // Market and customer data
  marketSegment: string = "";           // Market segment (e.g. SMEs, enterprise, etc.)
  marketSize: string = "";              // Market size (numeric or descriptive)
  marketTrends: string = "";            // Current market trends
  customerNeeds: string = "";           // Main customer needs
  customerExpectations: string = "";    // Customer expectations
  impactPotential: Priority = "Medium";   // Potential impact (Low/Medium/High)
  derivedSystems: string[] = [];          // E.g. ["drones", "autonomous submarines"]
  techConstraints: string[] = [];      // E.g. ["STANAG", "DO-178C", "GDPR"]
  regulatoryConstraints: string[] = [];
  evolutionStrategy: string = "";
  // Key capabilities or features (instead of "materials" or "components")
  capabilities: Capability[] = [];

  // Evaluation metrics for each potential product (used to guide decisions)
  marketImpact: number = 0;             // For example, a score from 0 to 100 estimating the ROI or commercial impact
  technicalComplexity: Priority = "Medium";  // Numeric scale (e.g. 1 to 5, where 5 is very complex)
  risk: Priority = "Medium";            // Estimated risk (Low/Medium/High) regarding stability or future changes
  strategicPriority: Priority = "Medium"; // Alignment with the strategic objectives (Low/Medium/High)

  // Additional comments (from marketing, process analysis, etc.)
  marketingComments: string = "";
  processComments: string = "";

  constructor(
    models: Model[] = [],
    languagesAllowed: string[] = []
  ) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
  }
}

