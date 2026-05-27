const navItems = ["회사소개", "사업분야", "프로젝트", "기술", "소식", "채용"];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-content items-center justify-between px-6 py-5 lg:px-8">
        <a href="#top" className="text-3xl font-extrabold tracking-[-0.04em] text-ink">
          ENGIS
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 lg:flex">
          {navItems.map((item) => (
            <a key={item} href={`#${item}`} className="transition hover:text-ink">
              {item}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="inline-flex items-center justify-center rounded-xl border border-forest bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#114534]"
        >
          문의하기
        </a>
      </div>
    </header>
  );
}
