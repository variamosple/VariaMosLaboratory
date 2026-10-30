import { MetricDefinition } from "../../../../Domain/Laboratory/Entities/Results";

/** Number formatting of the results (from the simulated interface of the roadmap v0.3). */
export const formatNumber = (value: number | null | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e7 || abs < 1e-3)) return value.toExponential(2);
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
};

/** Value with its unit; ratios and plain counts read as bare numbers. */
export const formatMetric = (value: number | null | undefined, metric?: Pick<MetricDefinition, "unit">) => {
  const number = formatNumber(value);
  const unit = metric?.unit || "";
  if (value === null || value === undefined || !unit || unit.startsWith("ratio") || unit === "count") return number;
  return `${number} ${unit}`;
};

export const formatDuration = (ms: number | null | undefined) => {
  if (ms === undefined || ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
};

export const formatPercent = (ratio: number | null | undefined) =>
  ratio === null || ratio === undefined ? "—" : `${Math.round(ratio * 1000) / 10} %`;

/** Round tick values covering [min, max]. */
export const niceTicks = (min: number, max: number, count = 4) => {
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) || raw;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
};

/** Categorical colours in fixed order, VariaMos blue first (validated palette of the simulated interface). */
export const SERIES_COLORS = ["#428dcf", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
