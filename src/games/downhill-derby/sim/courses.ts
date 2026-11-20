import { buildArlindo } from "./arlindo";
import type { Course, CourseId } from "./course";
import { buildTestHill } from "./testHill";

export function buildCourse(id: CourseId): Course {
  return id === "test" ? buildTestHill() : buildArlindo();
}
