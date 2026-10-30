import { Form } from "react-bootstrap";
import { ProjectSummary } from "../../DataProvider/Services/userProjectsService";

type ProjectSelectProps = {
    projects: ProjectSummary[];
    value: string;
    onChange: (projectId: string) => void;
    /** Adds an "All projects" choice with the empty value, for filters. */
    allowAll?: boolean;
    invalid?: boolean;
    id?: string;
};

/** LAB-EX-01: the VariaMos project of an experiment. */
export default function ProjectSelect({ projects, value, onChange, allowAll = false, invalid = false, id }: ProjectSelectProps) {
    // An experiment can be in a project the list does not return (e.g. no longer shared)
    const known = value === "" || projects.some((project) => project.id === value);

    return (
        <Form.Select
            id={id}
            aria-label="Project"
            value={value}
            isInvalid={invalid}
            onChange={(e) => onChange(e.target.value)}
        >
            {allowAll ? <option value="">All projects</option> : <option value="" disabled>Choose a project</option>}
            {!known && <option value={value}>{value}</option>}
            {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
            ))}
        </Form.Select>
    );
}
