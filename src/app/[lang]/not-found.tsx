import { NotFoundView } from "@/components/layout/NotFoundView";
import { getLocale } from "@/i18n/server";

export default async function NotFound() {
  return <NotFoundView locale={await getLocale()} />;
}
