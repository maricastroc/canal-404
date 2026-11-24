import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBar } from "@/components/layout/TopBar";

export default function SectionsLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar />
      <main id="content" className="flex-1 pb-6 pt-6 safe-inline [--pad-inline:0.75rem] sm:pt-10 sm:[--pad-inline:1.25rem]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
