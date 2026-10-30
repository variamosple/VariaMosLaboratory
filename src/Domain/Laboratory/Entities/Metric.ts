export interface Metric {
    id: string;
    /** Author of a private metric; null for a public one. */
    userId?: string | null;
    name: string;
    formula: string;
    unit: string;
    description?: string;
    script?: string;
    /** LAB-MT-01 catalog: REQ code, family, where the definition comes from, data the models need. */
    code?: string | null;
    category?: string | null;
    source?: string | null;
    formulaOrigin?: "spec" | "proposed" | null;
    requires?: string | null;
}
