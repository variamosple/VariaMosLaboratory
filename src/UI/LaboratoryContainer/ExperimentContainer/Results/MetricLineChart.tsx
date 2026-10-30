import { useEffect, useRef, useState } from "react";
import { MetricDefinition } from "../../../../Domain/Laboratory/Entities/Results";
import { MetricSeries } from "./comparison";
import { SERIES_COLORS, formatMetric, formatNumber, niceTicks } from "./format";

const HEIGHT = 240;
const MARGIN = { top: 12, right: 20, bottom: 44, left: 64 };

type Props = {
    metric: Pick<MetricDefinition, "code" | "name" | "unit">;
    runNumbers: number[];
    series: MetricSeries[];
};

/**
 * One metric across runs, one line per scenario and solver (LAB-MT-04,
 * LAB-VIS-02). The range of runs can be narrowed (zoom). From the simulated
 * interface of the roadmap v0.3.
 */
export default function MetricLineChart({ metric, runNumbers, series }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState<number | null>(null);
    const [from, setFrom] = useState(runNumbers[0]);
    const [to, setTo] = useState(runNumbers[runNumbers.length - 1]);

    useEffect(() => {
        setFrom(runNumbers[0]);
        setTo(runNumbers[runNumbers.length - 1]);
    }, [runNumbers]);

    useEffect(() => {
        const element = container.current;
        if (!element || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const shown = runNumbers.filter((n) => n >= from && n <= to);
    const visible = series.map((s) => ({ ...s, points: s.points.filter((p) => p.runNumber >= from && p.runNumber <= to) }));
    const values = visible.flatMap((s) => s.points.map((p) => p.value)).filter((v): v is number => v !== null);

    const ticks = values.length ? niceTicks(Math.min(0, ...values), Math.max(...values)) : [0, 1];
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (i: number) => MARGIN.left + (shown.length === 1 ? plotWidth / 2 : (i / (shown.length - 1)) * plotWidth);
    const y = (v: number) => MARGIN.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

    const path = (s: MetricSeries) =>
        s.points
            .map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`))
            .reduce((d, point, i, all) => (point ? `${d}${i > 0 && all[i - 1] ? "L" : "M"}${point}` : d), "");

    const onMove = (event: React.MouseEvent<SVGRectElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const px = event.clientX - box.left + MARGIN.left;
        let nearest = 0;
        shown.forEach((_, i) => {
            if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
        });
        setHover(nearest);
    };

    return (
        <figure className="lab-chart lab-line-chart" ref={container} aria-label={`${metric.name} across runs`}>
            <figcaption>
                <span className="lab-chart-title">
                    {metric.code && <span className="lab-code">{metric.code}</span>} {metric.name}
                </span>
                <span className="lab-chart-meta">{metric.unit} · across runs</span>
            </figcaption>
            <div className="d-flex gap-2 align-items-center small mb-2">
                <label htmlFor={`from-${metric.name}`}>Runs from</label>
                <select id={`from-${metric.name}`} className="form-select form-select-sm w-auto" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
                    {runNumbers.filter((n) => n <= to).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <label htmlFor={`to-${metric.name}`}>to</label>
                <select id={`to-${metric.name}`} className="form-select form-select-sm w-auto" value={to} onChange={(e) => setTo(Number(e.target.value))}>
                    {runNumbers.filter((n) => n >= from).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <ul className="lab-legend" aria-label="Scenario runs">
                {series.map((s, i) => (
                    <li key={s.name}>
                        <span className="lab-legend-swatch" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                        {s.name}
                    </li>
                ))}
            </ul>
            {values.length === 0 ? (
                <div className="lab-empty">No value of this metric in these runs.</div>
            ) : (
                <div className="position-relative">
                    <svg width={width} height={HEIGHT} role="img" aria-label={`${metric.name}, runs ${from} to ${to}`}>
                        {ticks.map((t) => (
                            <g key={t}>
                                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} className="lab-grid-line" />
                                <text x={MARGIN.left - 8} y={y(t)} className="lab-axis-label" textAnchor="end" dominantBaseline="middle">{formatNumber(t)}</text>
                            </g>
                        ))}
                        {shown.map((n, i) => (
                            <text key={n} x={x(i)} y={HEIGHT - MARGIN.bottom + 18} className="lab-axis-label" textAnchor="middle">Run {n}</text>
                        ))}
                        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} className="lab-crosshair" />}
                        {visible.map((s, i) => {
                            const color = SERIES_COLORS[i % SERIES_COLORS.length];
                            return (
                                <g key={s.name}>
                                    <path d={path(s)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                                    {s.points.map((p, j) =>
                                        p.value === null ? null : <circle key={p.runNumber} cx={x(j)} cy={y(p.value)} r={hover === j ? 5 : 4} fill={color} className="lab-marker" />
                                    )}
                                </g>
                            );
                        })}
                        <rect x={MARGIN.left} y={MARGIN.top} width={plotWidth} height={plotHeight} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} data-testid="line-chart-hit-area" />
                    </svg>
                    {hover !== null && (
                        <div className="lab-tooltip lab-line-tooltip" role="tooltip" style={{ left: Math.min(x(hover) + 12, width - 200), top: MARGIN.top }}>
                            <strong>Run {shown[hover]}</strong>
                            {visible.map((s, i) => (
                                <span key={s.name} className="d-flex align-items-center gap-2">
                                    <span className="lab-legend-swatch" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                                    {s.name}: {formatMetric(s.points[hover]?.value, metric)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </figure>
    );
}
