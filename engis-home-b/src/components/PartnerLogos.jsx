export default function PartnerLogos({ logos }) {
  return (
    <section id="회사소개" className="mx-auto w-full max-w-content px-6 py-10 lg:px-8">
      <div className="rounded-[30px] border border-black/6 bg-white/70 px-7 py-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Partners & Clients</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex min-h-24 items-center justify-center rounded-2xl border border-black/6 bg-white text-center text-lg font-semibold tracking-[-0.03em] text-ink/68"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
