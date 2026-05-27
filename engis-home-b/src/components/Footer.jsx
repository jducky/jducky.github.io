const footerColumns = {
  회사소개: ["회사 개요", "미션", "연혁"],
  사업분야: ["AI 데이터 분석", "공간정보 플랫폼", "디지털 트윈"],
  프로젝트: ["주요 프로젝트", "성과 사례"],
  기술: ["기술 스택", "연구개발"],
  채용: ["채용 공고", "복리후생"],
};

export default function Footer() {
  return (
    <footer id="contact" className="mt-10 bg-ink text-white">
      <div className="mx-auto grid w-full max-w-content gap-10 px-6 py-12 lg:grid-cols-[240px_repeat(5,minmax(0,1fr))] lg:px-8">
        <div>
          <p className="text-3xl font-extrabold tracking-[-0.04em]">ENGIS</p>
          <p className="mt-4 text-sm leading-7 text-white/66">
            공간과 환경 데이터를 기반으로 공공기관과 산업 현장의 실행 가능한 AI 서비스를 설계합니다.
          </p>
        </div>
        {Object.entries(footerColumns).map(([title, items]) => (
          <div key={title}>
            <h3 className="text-sm font-semibold text-white/86">{title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/62">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 px-6 py-5 text-sm text-white/52 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 ENGIS Co., Ltd. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#top">개인정보처리방침</a>
            <a href="#top">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
