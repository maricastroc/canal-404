import { buildArlindo } from "./arlindo";
import { buildFeira } from "./feira";
import type { Course, CourseId } from "./course";
import { buildTestHill } from "./testHill";

export function buildCourse(id: CourseId): Course {
  return id === "test" ? buildTestHill() : id === "feira" ? buildFeira() : buildArlindo();
}
