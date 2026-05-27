import ServiceCard from "./ServiceCard";

export default function ServiceSection({ services }) {
  return (
    <section id="사업분야" className="mx-auto w-full max-w-content px-6 py-10 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Service Areas</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink md:text-4xl">사업 영역을 카드 중심으로 명확하게 보여줍니다</h2>
        </div>
        <a href="#기술" className="hidden text-sm font-semibold text-ink/70 transition hover:text-ink md:inline-flex">
          기술 보기 →
        </a>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} />
        ))}
      </div>
    </section>
  );
}
