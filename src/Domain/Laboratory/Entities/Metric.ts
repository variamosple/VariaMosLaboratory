export interface Metric {
    id: string;
    name: string;
    formula: string;
    unit: string;
    description?: string;
    script?: string;
}