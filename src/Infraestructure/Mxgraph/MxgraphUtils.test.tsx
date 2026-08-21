//@ts-nocheck
import MxgraphUtils from "./MxgraphUtils";

beforeEach(() => {
  jest.spyOn(global.Math, "random").mockReturnValue(0.123456789);
  jest.useFakeTimers("modern");
  jest.setSystemTime(1655108206699);
});

afterEach(() => {
  jest.spyOn(global.Math, "random").mockRestore();
  jest.useRealTimers();
});

describe("Testing deleteSelection", function () {
  test("Testing deleteSelection", () => {
    const selectedCells = [{ value: null }, { value: null }];
    const graph = {
      isEnabled: jest.fn().mockReturnValue(true),
      getSelectionCells: jest.fn().mockReturnValue(selectedCells),
      removeCells: jest.fn(),
    };

    MxgraphUtils.deleteSelection(graph, {} as any);

    expect(graph.removeCells).toHaveBeenCalledWith(selectedCells, true);
  });
});

describe("Testing findVerticeById", function () {
  test("Testing findVerticeById", () => {
    const nestedVertex = { value: { getAttribute: () => "target" } };
    const childVertex = { value: { getAttribute: () => "other" } };
    const graph = {
      getDefaultParent: jest.fn().mockReturnValue("root"),
      getChildVertices: jest
        .fn()
        .mockReturnValueOnce([childVertex])
        .mockReturnValueOnce([nestedVertex]),
    };

    expect(MxgraphUtils.findVerticeById(graph, "target")).toBe(nestedVertex);
  });
});

describe("Testing findEdgeById", function () {
  test("Testing findEdgeById", () => {
    const edge = { value: { getAttribute: () => "edge-id" } };
    const graph = {
      getDefaultParent: jest.fn().mockReturnValue("root"),
      getChildEdges: jest.fn().mockReturnValue([edge]),
    };

    expect(MxgraphUtils.findEdgeById(graph, "edge-id")).toBe(edge);
  });
});
