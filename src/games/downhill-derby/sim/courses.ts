import { buildArlindo } from "./arlindo";
import { buildAntena } from "./antena";
import { buildFeira } from "./feira";
import type { Course, CourseId } from "./course";

export function buildCourse(id: CourseId): Course {
  return id === "feira" ? buildFeira() : id === "antena" ? buildAntena() : buildArlindo();
}
