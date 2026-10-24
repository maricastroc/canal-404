import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBar } from "@/components/layout/TopBar";

export default function SectionsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar />
      <main id="content" className="flex-1 px-3 pb-6 pt-6 sm:px-5 sm:pt-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
