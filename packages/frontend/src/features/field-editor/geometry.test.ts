import { describe, expect, it } from "vite-plus/test";
import { generateGrid, snapPoint, type DraftField } from "./geometry";

const metersPerDegree = 111_195.0802335;
const latitude = 46;
const longitude = 11;
const metersPerLongitude = metersPerDegree * Math.cos((latitude * Math.PI) / 180);

function coordinate(x: number, y: number) {
  return { lat: latitude + y / metersPerDegree, lng: longitude + x / metersPerLongitude };
}

function fieldFrom(points: [number, number][]): DraftField {
  return {
    id: "field",
    name: "Field",
    closed: true,
    boundary: points.map(([x, y], index) => ({ ...coordinate(x, y), id: String(index) })),
    objects: [],
  };
}

describe("generateGrid", () => {
  it("uses meter spacing at the field latitude and clips to a concave boundary", () => {
    const field = fieldFrom([
      [0, 0],
      [15, 0],
      [15, 5],
      [5, 5],
      [5, 15],
      [0, 15],
    ]);
    const result = generateGrid(field, "plant", 5);
    expect(
      result.coordinates?.map(({ lat, lng }) => [
        Math.round((lng - longitude) * metersPerLongitude),
        Math.round((lat - latitude) * metersPerDegree),
      ]),
    ).toEqual([
      [0, 0],
      [5, 0],
      [10, 0],
      [15, 0],
      [0, 5],
      [5, 5],
      [10, 5],
      [15, 5],
      [0, 10],
      [5, 10],
      [0, 15],
      [5, 15],
    ]);
  });

  it("follows the first boundary edge and skips existing points of the same kind", () => {
    const field = fieldFrom([
      [0, 0],
      [6, 8],
      [-2, 14],
      [-8, 6],
    ]);
    field.objects.push({ ...coordinate(0, 0), id: "plant", kind: "plant" });
    const plants = generateGrid(field, "plant", 5).coordinates;
    expect(plants).toHaveLength(8);
    expect(plants?.[0]?.lat).toBeCloseTo(coordinate(3, 4).lat, 9);
    expect(plants?.[0]?.lng).toBeCloseTo(coordinate(3, 4).lng, 9);
    expect(generateGrid(field, "pole", 5).coordinates).toHaveLength(9);
  });

  it("rejects open, flat, or excessively dense grids", () => {
    const field = fieldFrom([
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ]);
    expect(generateGrid({ ...field, closed: false }, "pole", 5).error).toMatch(/Close/);
    expect(generateGrid(field, "pole", 0).error).toMatch(/greater than zero/);
    expect(generateGrid(field, "pole", 0.05).error).toMatch(/larger spacing/);
    expect(
      generateGrid(
        fieldFrom([
          [0, 0],
          [10, 0],
          [20, 0],
        ]),
        "pole",
        5,
      ).error,
    ).toMatch(/area/);
  });
});

describe("snapPoint", () => {
  it("snaps each axis to its closest guide within the pixel threshold", () => {
    const anchors = [
      { x: 17, y: 80 },
      { x: 13, y: 70 },
      { x: 90, y: 23 },
    ];
    expect(snapPoint({ x: 14, y: 20 }, anchors)).toEqual({
      position: { x: 13, y: 23 },
      vertical: 13,
      horizontal: 23,
    });
    expect(snapPoint({ x: 29, y: 40 }, anchors).position).toEqual({ x: 29, y: 40 });
  });
});
