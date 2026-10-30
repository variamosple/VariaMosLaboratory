import { SolverDescriptor, SolverSettings } from "../../../../../Domain/Laboratory/Entities/SolverConfig";

type SolverSettingsFormProps = {
    /** Unique per scenario. */
    idPrefix: string;
    solver: SolverDescriptor;
    settings: SolverSettings;
    onChange: (settings: SolverSettings) => void;
};

/** Version and parameters of one solver, as the Reasoning catalog describes them (LAB-CF-02). */
export default function SolverSettingsForm({ idPrefix, solver, settings, onChange }: SolverSettingsFormProps) {
    const set = (name: string, value: string | number | undefined) => onChange({ ...settings, [name]: value });

    return (
        <div className="config-form">
            <div className="mb-3">
                <label htmlFor={`${idPrefix}-${solver.id}-version`} className="form-label">
                    Version
                </label>
                <select
                    id={`${idPrefix}-${solver.id}-version`}
                    className="form-select"
                    value={settings.version ?? ""}
                    onChange={(e) => set("version", e.target.value)}
                >
                    {!solver.versions.includes(settings.version as string) && (
                        <option value={settings.version ?? ""}>{settings.version || "Choose a version"}</option>
                    )}
                    {solver.versions.map((version) => (
                        <option key={version} value={version}>{version}</option>
                    ))}
                </select>
                <small className="text-muted d-block mt-1">
                    Runs use exactly this version (LAB-R-03).
                </small>
            </div>

            {solver.parameters.map((parameter) => {
                const id = `${idPrefix}-${solver.id}-${parameter.name}`;
                const value = settings[parameter.name];

                if (parameter.type === "enum") {
                    const selected = parameter.options?.find((option) => option.value === value);
                    return (
                        <div className="mb-3" key={parameter.name}>
                            <label htmlFor={id} className="form-label">{parameter.label}</label>
                            <select
                                id={id}
                                className="form-select"
                                value={value ?? ""}
                                onChange={(e) => set(parameter.name, e.target.value)}
                            >
                                {parameter.options?.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <small className="text-muted d-block mt-1">
                                {selected?.description ?? parameter.description}
                            </small>
                        </div>
                    );
                }

                return (
                    <div className="mb-3" key={parameter.name}>
                        <label htmlFor={id} className="form-label">{parameter.label}</label>
                        <input
                            id={id}
                            type="number"
                            className="form-control"
                            min={parameter.min}
                            max={parameter.max}
                            step={1}
                            value={value ?? ""}
                            onChange={(e) =>
                                set(parameter.name, e.target.value === "" ? undefined : Number(e.target.value))
                            }
                        />
                        {parameter.description && (
                            <small className="text-muted d-block mt-1">{parameter.description}</small>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
