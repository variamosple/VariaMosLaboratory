import { PagedModel } from "../../Core/Entities/PagedModel";

export class ExperimentFilter extends PagedModel {
  constructor(
    public name?: string,
    public userId?: string,
    pageNumber?: number,
    pageSize?: number,
    public projectId?: string,
    /** LAB-COL-04 */
    public researcher?: string,
    public status?: string,
    public createdFrom?: string,
    public createdTo?: string,
    public type?: "experiment" | "template" | "benchmark"
  ) {
    super(pageNumber, pageSize);
  }
}