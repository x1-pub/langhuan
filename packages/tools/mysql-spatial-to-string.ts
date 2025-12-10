import type {
  IPoint,
  ILineString,
  IPolygon,
  IMultiPoint,
  IMultiLineString,
  IMultiPolygon,
  IGeometryCollection,
} from '../types/mysql';

type TSpatialData =
  | IPoint
  | ILineString
  | IPolygon
  | IMultiPoint
  | IMultiLineString
  | IMultiPolygon
  | IGeometryCollection;

type Coordinate = [number, number];

const isCoordinate = (v: unknown): v is Coordinate =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';

const isCoordinateArray = (v: unknown): v is Coordinate[] =>
  Array.isArray(v) && v.every(isCoordinate);

const isCoordinateArrayArray = (v: unknown): v is Coordinate[][] =>
  Array.isArray(v) && v.every(isCoordinateArray);

const isCoordinateArrayArrayArray = (v: unknown): v is Coordinate[][][] =>
  Array.isArray(v) && v.every(isCoordinateArrayArray);

const deep = (v: unknown): string => {
  if (isGeometryCollection(v)) {
    return `GEOMETRYCOLLECTION(${v.geometries.map(g => deep(g)).join(', ')})`;
  }

  if (isPoint(v)) {
    return `POINT(${v.coordinates.join(' ')})`;
  }

  if (isLineString(v)) {
    return `LINESTRING(${v.coordinates.map(c => c.join(' ')).join(', ')})`;
  }

  if (isPolygon(v)) {
    return `POLYGON(${v.coordinates.map(ring => `(${ring.map(c => c.join(' ')).join(', ')})`).join(', ')})`;
  }

  if (isMultiPoint(v)) {
    return `MULTIPOINT(${v.coordinates.map(c => c.join(' ')).join(', ')})`;
  }

  if (isMultiLineString(v)) {
    return `MULTILINESTRING(${v.coordinates
      .map(line => `(${line.map(c => c.join(' ')).join(', ')})`)
      .join(', ')})`;
  }

  if (isMultiPolygon(v)) {
    return `MULTIPOLYGON(${v.coordinates
      .map(poly => `(${poly.map(ring => `(${ring.map(c => c.join(' ')).join(', ')})`).join(', ')})`)
      .join(', ')})`;
  }

  throw new Error('Unknown spatial type');
};

function isPoint(v: unknown): v is IPoint {
  return isObj(v) && v.type === 'Point' && isCoordinate(v.coordinates);
}

function isLineString(v: unknown): v is ILineString {
  return isObj(v) && v.type === 'LineString' && isCoordinateArray(v.coordinates);
}

function isPolygon(v: unknown): v is IPolygon {
  return isObj(v) && v.type === 'Polygon' && isCoordinateArrayArray(v.coordinates);
}

function isMultiPoint(v: unknown): v is IMultiPoint {
  return isObj(v) && v.type === 'MultiPoint' && isCoordinateArray(v.coordinates);
}

function isMultiLineString(v: unknown): v is IMultiLineString {
  return isObj(v) && v.type === 'MultiLineString' && isCoordinateArrayArray(v.coordinates);
}

function isMultiPolygon(v: unknown): v is IMultiPolygon {
  return isObj(v) && v.type === 'MultiPolygon' && isCoordinateArrayArrayArray(v.coordinates);
}

function isGeometryCollection(v: unknown): v is IGeometryCollection {
  return isObj(v) && v.type === 'GeometryCollection' && Array.isArray(v.geometries);
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export const mysqlSpatialToString = (v: TSpatialData): string => deep(v);
