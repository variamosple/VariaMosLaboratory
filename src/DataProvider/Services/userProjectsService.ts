import { PROJECTS_CLIENT } from "../../Infraestructure/AxiosConfig";

/** A VariaMos project an experiment can belong to (LAB-EX-01). */
export type ProjectSummary = { id: string; name: string };

let projects: Promise<ProjectSummary[]> | null = null;

/**
 * GET /getProjects (vms_projects)
 * Projects the user owns or that are shared with them, loaded once per page.
 */
export const getUserProjects = (): Promise<ProjectSummary[]> => {
  if (!projects) {
    projects = PROJECTS_CLIENT.get("/getProjects")
      .then((response) => {
        const { owned_projects = [], shared_projects = [] } = response.data ?? {};
        const byId = new Map<string, ProjectSummary>();
        for (const project of [...owned_projects, ...shared_projects]) {
          if (project?.id) byId.set(project.id, { id: project.id, name: project.name || project.id });
        }
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
      })
      .catch((error) => {
        projects = null;
        console.error("Error fetching the user's projects:", error);
        throw error;
      });
  }
  return projects;
};

/** Forgets the loaded projects (tests). */
export const resetUserProjects = () => {
  projects = null;
};
