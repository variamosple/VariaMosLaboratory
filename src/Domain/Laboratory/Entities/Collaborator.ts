export enum ExperimentRoleEnum {
    OWNER = "owner",
    DIRECTOR = "director",
    EDITOR = "editor",
    VIEWER = "viewer",
}

export type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: ExperimentRoleEnum;
};