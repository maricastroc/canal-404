import Matter from "matter-js";
import { cos, sin } from "./trig";

export const DEG_TO_RAD = Math.PI / 180;

const CHAMFER_STEPS = 4;
const CIRCLE_MAX_SIDES = 25;

function rotateVertices(vertices: Matter.Vector[], angle: number, point: Matter.Vector) {
  if (angle === 0) return vertices;
  const c = cos(angle);
  const s = sin(angle);
  const px = point.x;
  const py = point.y;
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i];
    const dx = v.x - px;
    const dy = v.y - py;
    v.x = px + (dx * c - dy * s);
    v.y = py + (dx * s + dy * c);
  }
  return vertices;
}

function rotateAxes(axes: Matter.Vector[], angle: number) {
  if (angle === 0) return;
  const c = cos(angle);
  const s = sin(angle);
  for (let i = 0; i < axes.length; i += 1) {
    const axis = axes[i];
    const x = axis.x * c - axis.y * s;
    axis.y = axis.x * s + axis.y * c;
    axis.x = x;
  }
}

function rotateVector(vector: Matter.Vector, angle: number, output: Matter.Vector = { x: 0, y: 0 }) {
  const c = cos(angle);
  const s = sin(angle);
  const x = vector.x * c - vector.y * s;
  output.y = vector.x * s + vector.y * c;
  output.x = x;
  return output;
}

Matter.Vertices.rotate = rotateVertices;
Matter.Axes.rotate = rotateAxes;
Matter.Vector.rotate = rotateVector;
Object.assign(Matter.Resolver, { _restingThresh: 2, _restingThreshTangent: Math.sqrt(6) });

function normalise(x: number, y: number) {
  const length = Math.sqrt(x * x + y * y);
  return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
}

function roundedCorners(width: number, height: number, radius: number) {
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  if (radius <= 0) return corners;
  const out: Matter.Vector[] = [];
  const diagonal = Math.sqrt(2 * radius * radius);
  const theta = Math.PI / 2 / CHAMFER_STEPS;
  corners.forEach((corner, i) => {
    const prev = corners[(i + corners.length - 1) % corners.length];
    const next = corners[(i + 1) % corners.length];
    const prevNormal = normalise(corner.y - prev.y, prev.x - corner.x);
    const nextNormal = normalise(next.y - corner.y, corner.x - next.x);
    const mid = normalise((prevNormal.x + nextNormal.x) * 0.5, (prevNormal.y + nextNormal.y) * 0.5);
    const cx = corner.x - mid.x * diagonal;
    const cy = corner.y - mid.y * diagonal;
    const rx = prevNormal.x * radius;
    const ry = prevNormal.y * radius;
    for (let j = 0; j < CHAMFER_STEPS; j += 1) {
      const c = cos(theta * j);
      const s = sin(theta * j);
      out.push({ x: rx * c - ry * s + cx, y: rx * s + ry * c + cy });
    }
  });
  return out;
}

export function roundedRectangle(x: number, y: number, width: number, height: number, radius: number, options: Matter.IBodyDefinition = {}) {
  return Matter.Body.create({ label: "Rectangle Body", ...options, position: { x, y }, vertices: roundedCorners(width, height, radius) });
}

export function circle(x: number, y: number, radius: number, options: Matter.IBodyDefinition = {}) {
  let sides = Math.ceil(Math.max(10, Math.min(CIRCLE_MAX_SIDES, radius)));
  if (sides % 2 === 1) sides += 1;
  const theta = (2 * Math.PI) / sides;
  const offset = theta * 0.5;
  const vertices: Matter.Vector[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = offset + i * theta;
    vertices.push({ x: Number((cos(angle) * radius).toFixed(3)), y: Number((sin(angle) * radius).toFixed(3)) });
  }
  const definition: Matter.IBodyDefinition & { circleRadius: number } = { label: "Circle Body", circleRadius: radius, ...options, position: { x, y }, vertices };
  return Matter.Body.create(definition);
}

export { Matter };
