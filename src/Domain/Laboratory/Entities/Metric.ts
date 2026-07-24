export interface Metric {
    id: string;
    userId?: string;
    name: string;
    formula: string;
    unit: string;
    description?: string;
    script?: string;
    isCustom?: boolean;
}