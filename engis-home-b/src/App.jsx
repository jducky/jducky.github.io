import Header from "./components/Header";
import Hero from "./components/Hero";
import ServiceSection from "./components/ServiceSection";
import ProjectSection from "./components/ProjectSection";
import TechAccordion from "./components/TechAccordion";
import PartnerLogos from "./components/PartnerLogos";
import Footer from "./components/Footer";
import { heroStats, partnerLogos, projects, services, techStacks } from "./data/siteContent";

export default function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,79,36,0.12),_transparent_24%),radial-gradient(circle_at_90%_20%,_rgba(15,59,46,0.12),_transparent_22%),linear-gradient(180deg,_#f8f5ee_0%,_#f3ecdf_100%)] text-ink">
      <Header />
      <main>
        <Hero stats={heroStats} />
        <ServiceSection services={services} />
        <ProjectSection projects={projects} />
        <TechAccordion items={techStacks} />
        <PartnerLogos logos={partnerLogos} />
      </main>
      <Footer />
    </div>
  );
}
