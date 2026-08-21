import { ExperimentFilter } from "./ExperimentFilter";

test("ExperimentFilter keeps filters and pagination defaults", () => {
  expect(new ExperimentFilter()).toMatchObject({
    pageNumber: 1,
    pageSize: 20,
  });

  expect(new ExperimentFilter("trial", "user-1", 3, 5)).toMatchObject({
    name: "trial",
    userId: "user-1",
    pageNumber: 3,
    pageSize: 5,
  });
});