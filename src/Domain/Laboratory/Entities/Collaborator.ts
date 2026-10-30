export enum ExperimentRoleEnum {
    OWNER = "owner",
    DIRECTOR = "director",
    EDITOR = "editor",
    VIEWER = "viewer",
}

/** LAB-COL-01: what a user may do on an experiment. */
export type Permissions = { read: boolean; write: boolean; execute: boolean; manage: boolean };

/** Given when sharing: read always, write and execute separately. */
export type SharedAccess = { write: boolean; execute: boolean };

export type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: ExperimentRoleEnum;
  permissions?: Permissions;
};