export type Coordinates = { lat: number; lng: number };
export type ObjectKind = "plant" | "pole";
export type MapPoint = Coordinates & { id: string };
export type FieldObject = MapPoint & { kind: ObjectKind };
export type DraftField = {
  id: string;
  name: string;
  boundary: MapPoint[];
  closed: boolean;
  objects: FieldObject[];
};

type Point = { x: number; y: number };

const metersPerDegree = (6_371_008.8 * Math.PI) / 180;
const edgeTolerance = 0.001;
export const gridLimit = 500;

function localProjection(origin: Coordinates) {
  const metersPerLongitude = metersPerDegree * Math.cos((origin.lat * Math.PI) / 180);
  return {
    project({ lat, lng }: Coordinates): Point {
      const longitudeDelta = lng - origin.lng;
      return {
        x: (longitudeDelta - 360 * Math.round(longitudeDelta / 360)) * metersPerLongitude,
        y: (lat - origin.lat) * metersPerDegree,
      };
    },
    unproject({ x, y }: Point): Coordinates {
      return { lat: origin.lat + y / metersPerDegree, lng: origin.lng + x / metersPerLongitude };
    },
  };
}

function insidePolygon({ x, y }: Point, polygon: Point[]) {
  let inside = false;
  for (const [index, start] of polygon.entries()) {
    const end = polygon[(index + 1) % polygon.length]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const along = (x - start.x) * dx + (y - start.y) * dy;
    const cross = (x - start.x) * dy - (y - start.y) * dx;
    if (
      length > 0 &&
      Math.abs(cross) <= edgeTolerance * length &&
      along >= -edgeTolerance * length &&
      along <= length * (length + edgeTolerance)
    ) {
      return true;
    }
    if (start.y > y !== end.y > y && x < start.x + ((y - start.y) * dx) / dy) {
      inside = !inside;
    }
  }
  return inside;
}

export function generateGrid(field: DraftField, kind: ObjectKind, spacing: number) {
  const [origin, next] = field.boundary;
  if (!field.closed || field.boundary.length < 3 || !origin || !next) {
    return { error: "Close the field boundary before generating a grid." };
  }
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return { error: "Enter a spacing greater than zero." };
  }

  const projection = localProjection(origin);
  const edge = projection.project(next);
  const length = Math.hypot(edge.x, edge.y);
  if (length < edgeTolerance) {
    return { error: "Move the first two boundary corners apart to set the grid direction." };
  }

  const cos = edge.x / length;
  const sin = edge.y / length;
  const toGrid = ({ x, y }: Point) => ({ x: x * cos + y * sin, y: y * cos - x * sin });
  const polygon = field.boundary.map((point) => toGrid(projection.project(point)));
  const area = polygon.reduce((sum, point, index) => {
    const nextPoint = polygon[(index + 1) % polygon.length]!;
    return sum + point.x * nextPoint.y - point.y * nextPoint.x;
  }, 0);
  if (Math.abs(area) < edgeTolerance) {
    return { error: "Draw a boundary that encloses an area." };
  }

  const xValues = polygon.map((point) => point.x);
  const yValues = polygon.map((point) => point.y);
  const minColumn = Math.ceil((Math.min(...xValues) - edgeTolerance) / spacing);
  const maxColumn = Math.floor((Math.max(...xValues) + edgeTolerance) / spacing);
  const minRow = Math.ceil((Math.min(...yValues) - edgeTolerance) / spacing);
  const maxRow = Math.floor((Math.max(...yValues) + edgeTolerance) / spacing);
  const limitError = {
    error: `Use a larger spacing. Each grid can add up to ${gridLimit} points.`,
  };
  if ((maxColumn - minColumn + 1) * (maxRow - minRow + 1) > 20_000) {
    return limitError;
  }

  const existing = field.objects
    .filter((object) => object.kind === kind)
    .map((object) => toGrid(projection.project(object)));
  const duplicateTolerance = Math.min(spacing / 4, 0.1);
  const coordinates: Coordinates[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let column = minColumn; column <= maxColumn; column++) {
      const x = column * spacing;
      const y = row * spacing;
      if (!insidePolygon({ x, y }, polygon)) continue;
      if (existing.some((point) => Math.hypot(x - point.x, y - point.y) < duplicateTolerance)) {
        continue;
      }
      if (coordinates.length === gridLimit) return limitError;
      coordinates.push(projection.unproject({ x: x * cos - y * sin, y: x * sin + y * cos }));
    }
  }
  return { coordinates };
}

export function snapPoint(point: Point, anchors: Iterable<Point>, tolerance = 7) {
  let x: number | undefined;
  let y: number | undefined;
  let xDistance = tolerance;
  let yDistance = tolerance;
  for (const anchor of anchors) {
    const dx = Math.abs(point.x - anchor.x);
    const dy = Math.abs(point.y - anchor.y);
    if (dx < xDistance) {
      x = anchor.x;
      xDistance = dx;
    }
    if (dy < yDistance) {
      y = anchor.y;
      yDistance = dy;
    }
  }
  return { position: { x: x ?? point.x, y: y ?? point.y }, vertical: x, horizontal: y };
}
