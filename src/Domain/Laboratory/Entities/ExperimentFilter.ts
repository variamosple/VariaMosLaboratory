import { PagedModel } from "../../Core/Entities/PagedModel";

export class ExperimentFilter extends PagedModel {
  constructor(
    public name?: string,
    public userId?: string,
    pageNumber?: number,
    pageSize?: number
  ) {
    super(pageNumber, pageSize);
  }
}