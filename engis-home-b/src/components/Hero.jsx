export default function Hero({ stats }) {
  return (
    <section id="top" className="mx-auto flex w-full max-w-content flex-col gap-10 px-6 pb-10 pt-10 lg:px-8 lg:pt-16">
      <div className="rounded-[36px] border border-black/6 bg-white/80 px-7 py-10 shadow-panel backdrop-blur-sm lg:px-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-terracotta">
              Space Intelligence for Public Impact
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-[-0.05em] text-ink md:text-6xl">
              공간·환경 데이터와 AI로
              <br />
              더 스마트한 현장을 만듭니다
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
              엔지스는 공공기관과 산업 현장의 데이터를 구조화하고, GIS와 AI를 결합해 분석 가능한 플랫폼과
              실행 가능한 서비스로 연결합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#사업분야"
                className="inline-flex min-h-14 items-center rounded-2xl bg-forest px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                사업 분야 보기
              </a>
              <a
                href="#프로젝트"
                className="inline-flex min-h-14 items-center rounded-2xl border border-black/10 bg-white px-6 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
              >
                프로젝트 보기
              </a>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[30px] border border-black/6 bg-[linear-gradient(160deg,_#103526_0%,_#0d2538_55%,_#0f1826_100%)] p-7 text-white shadow-panel">
            <div className="flex items-center justify-between text-sm font-medium text-white/70">
              <span>Integrated Capability</span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs tracking-[0.2em] text-white/85">
                ENGIS LAB
              </span>
            </div>
            <div className="mt-10">
              <p className="text-sm uppercase tracking-[0.26em] text-[#b7d5c6]">Core Stack</p>
              <div className="mt-5 space-y-4">
                {["GIS / Spatial Platform", "AI Data Analysis", "Digital Twin", "Public SI Consulting"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <strong className="text-base font-semibold">{item}</strong>
                      <span className="text-sm text-white/60">0{index + 1}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,_#bf4f24,_#f0b48e)]"
                        style={{ width: `${72 + index * 8}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-black/6 bg-white/70 px-6 py-6 shadow-panel">
            <p className="text-4xl font-extrabold tracking-[-0.04em] text-ink">{stat.value}</p>
            <p className="mt-3 text-sm font-medium text-ink/62">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
