import ProjectCard from "./ProjectCard";

export default function ProjectSection({ projects }) {
  return (
    <section id="프로젝트" className="mx-auto w-full max-w-content px-6 py-10 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Selected Work</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink md:text-4xl">주요 프로젝트</h2>
        </div>
        <a href="#contact" className="hidden text-sm font-semibold text-ink/70 transition hover:text-ink md:inline-flex">
          전체 보기 →
        </a>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard key={project.title} {...project} />
        ))}
      </div>
    </section>
  );
}
