import { useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { MetricDefinition } from "../../../../Domain/Laboratory/Entities/Results";
import { SERIES_COLORS, formatMetric, formatNumber, niceTicks } from "./format";

export interface ScatterPoint {
    label: string;
    x: number;
    y: number;
}

const WIDTH = 520;
const HEIGHT = 300;
const MARGIN = { top: 12, right: 20, bottom: 48, left: 64 };

type Domain = { x: [number, number]; y: [number, number] };

const domainOf = (values: number[]): [number, number] => {
    const ticks = niceTicks(Math.min(0, ...values), Math.max(...values));
    return [ticks[0], ticks[ticks.length - 1]];
};

/** LAB-VIS-02: two metrics against each other, one point per scenario run; zoom in, out and reset. */
export default function ScatterChart({ xMetric, yMetric, points }: { xMetric: MetricDefinition; yMetric: MetricDefinition; points: ScatterPoint[] }) {
    const full = useMemo<Domain | null>(
        () => (points.length ? { x: domainOf(points.map((p) => p.x)), y: domainOf(points.map((p) => p.y)) } : null),
        [points]
    );
    const [zoom, setZoom] = useState(1);
    const [hover, setHover] = useState<number | null>(null);

    if (!full) return <div className="lab-empty">No scenario run has a value for both metrics.</div>;

    // Zooming centres on the points, not on the axis: the axis starts at 0 and
    // the points can all sit at one end of it. The window stays on the axis.
    const scaled = (range: [number, number], values: number[]): [number, number] => {
        const half = (range[1] - range[0]) / 2 / zoom;
        const middle = (Math.min(...values) + Math.max(...values)) / 2;
        const centre = Math.min(Math.max(middle, range[0] + half), range[1] - half);
        return [centre - half, centre + half];
    };
    const domain = { x: scaled(full.x, points.map((p) => p.x)), y: scaled(full.y, points.map((p) => p.y)) };
    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const sx = (v: number) => MARGIN.left + ((v - domain.x[0]) / (domain.x[1] - domain.x[0] || 1)) * plotWidth;
    const sy = (v: number) => MARGIN.top + plotHeight - ((v - domain.y[0]) / (domain.y[1] - domain.y[0] || 1)) * plotHeight;
    const inside = (p: ScatterPoint) => p.x >= domain.x[0] && p.x <= domain.x[1] && p.y >= domain.y[0] && p.y <= domain.y[1];
    const xTicks = niceTicks(domain.x[0], domain.x[1]).filter((t) => t >= domain.x[0] && t <= domain.x[1]);
    const yTicks = niceTicks(domain.y[0], domain.y[1]).filter((t) => t >= domain.y[0] && t <= domain.y[1]);

    return (
        <figure className="lab-chart lab-scatter" aria-label={`${yMetric.name} against ${xMetric.name}`}>
            <figcaption>
                <span className="lab-chart-title">{yMetric.name} against {xMetric.name}</span>
                <span className="lab-chart-meta">One point per scenario run · zoom ×{zoom} · {points.filter(inside).length} of {points.length} points shown</span>
            </figcaption>
            <div className="d-flex gap-2 mb-2">
                <Button size="sm" variant="outline-secondary" onClick={() => setZoom(zoom * 2)}>Zoom in</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setZoom(Math.max(1, zoom / 2))} disabled={zoom === 1}>Zoom out</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setZoom(1)} disabled={zoom === 1}>Reset</Button>
            </div>
            <div className="position-relative">
                <svg width={WIDTH} height={HEIGHT} role="img" aria-label={`Scatter plot, x from ${formatNumber(domain.x[0])} to ${formatNumber(domain.x[1])}`}>
                    {yTicks.map((t) => (
                        <g key={`y${t}`}>
                            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={sy(t)} y2={sy(t)} className="lab-grid-line" />
                            <text x={MARGIN.left - 8} y={sy(t)} className="lab-axis-label" textAnchor="end" dominantBaseline="middle">{formatNumber(t)}</text>
                        </g>
                    ))}
                    {xTicks.map((t) => (
                        <text key={`x${t}`} x={sx(t)} y={HEIGHT - MARGIN.bottom + 16} className="lab-axis-label" textAnchor="middle">{formatNumber(t)}</text>
                    ))}
                    <text x={MARGIN.left + plotWidth / 2} y={HEIGHT - 8} className="lab-axis-title" textAnchor="middle">{xMetric.name}</text>
                    <text x={12} y={MARGIN.top + plotHeight / 2} className="lab-axis-title" textAnchor="middle" transform={`rotate(-90 12 ${MARGIN.top + plotHeight / 2})`}>{yMetric.name}</text>
                    {points.map((p, i) =>
                        inside(p) ? (
                            <circle
                                key={p.label}
                                cx={sx(p.x)}
                                cy={sy(p.y)}
                                r={hover === i ? 7 : 5}
                                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                                className="lab-marker"
                                aria-label={p.label}
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}
                            />
                        ) : null
                    )}
                </svg>
                {hover !== null && (
                    <div className="lab-tooltip lab-point-tooltip" role="tooltip" style={{ left: Math.min(sx(points[hover].x) + 12, WIDTH - 200), top: sy(points[hover].y) }}>
                        <strong>{points[hover].label}</strong>
                        <span>{xMetric.name}: {formatMetric(points[hover].x, xMetric)}</span>
                        <span>{yMetric.name}: {formatMetric(points[hover].y, yMetric)}</span>
                    </div>
                )}
            </div>
        </figure>
    );
}
