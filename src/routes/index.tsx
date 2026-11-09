import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/welcome-hero.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — Quantum Center Open Day | Technion" },
      {
        name: "description",
        content:
          "Helen Diller Quantum Center Open Day at the Technion. Undergraduate projects, MSc and PhD research opportunities.",
      },
      { property: "og:title", content: "Welcome — Quantum Center Open Day" },
      {
        property: "og:description",
        content: "Explore research opportunities at the Helen Diller Quantum Center, Technion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#02060d]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-[#02060d] overflow-hidden">
        <section className="flex min-h-[calc(100vh-58px)] w-full items-center justify-center p-2 sm:p-4">
          <img
            src={heroImg}
            alt="Quantum Center Open Day 9.11.2026: Helen Diller Quantum Center, Technion"
            className="max-h-[calc(100vh-74px)] w-full max-w-[1600px] h-auto object-contain select-none rounded-lg shadow-2xl"
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
