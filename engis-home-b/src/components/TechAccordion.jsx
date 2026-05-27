export default function TechAccordion({ items }) {
  return (
    <section id="기술" className="mx-auto w-full max-w-content px-6 py-10 lg:px-8">
      <div className="grid gap-6 rounded-[34px] border border-black/6 bg-white/75 p-7 shadow-panel lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-10">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Technology</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink md:text-4xl">
              기술이 만드는 변화,
              <br />
              데이터가 여는 미래
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-ink/66">
              엔지스는 공간 데이터 처리, 환경 분석, AI 모델링, 클라우드 운영을 하나의 실무 흐름으로 통합합니다.
            </p>
          </div>
          <a
            href="#contact"
            className="mt-8 inline-flex min-h-14 w-fit items-center rounded-2xl border border-black/10 bg-white px-6 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
          >
            기술 소개 받기
          </a>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <details key={item.title} className="group rounded-[24px] border border-black/6 bg-white px-5 py-4" open={item.defaultOpen}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-lg font-semibold text-ink">{item.title}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-black/10 text-xl text-ink/60 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-4 text-sm leading-7 text-ink/64">{item.desc}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
