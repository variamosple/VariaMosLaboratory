import { addComment, deleteComment, editComment, getComments } from "./commentService";
import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";

describe("comment service (LAB-COL-03)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("lists, adds, edits and deletes the comments of an experiment", async () => {
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: [] } as any);
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: {} } as any);
    const put = jest.spyOn(LABORATORY_CLIENT, "put").mockResolvedValue({ data: {} } as any);
    const remove = jest.spyOn(LABORATORY_CLIENT, "delete").mockResolvedValue({ data: {} } as any);

    await getComments("e1");
    await addComment("e1", { targetType: "scenario_run", targetId: "sr1", metricId: "m1", body: "Matches" });
    await editComment("e1", "c1", "Edited");
    await deleteComment("e1", "c1");

    expect(get).toHaveBeenCalledWith("/experiments/e1/comments");
    expect(post).toHaveBeenCalledWith("/experiments/e1/comments", { targetType: "scenario_run", targetId: "sr1", metricId: "m1", body: "Matches" });
    expect(put).toHaveBeenCalledWith("/experiments/e1/comments/c1", { body: "Edited" });
    expect(remove).toHaveBeenCalledWith("/experiments/e1/comments/c1");
  });
});
