const toneMap = {
  terracotta: "bg-terracotta text-white",
  forest: "bg-forest text-white",
  navy: "bg-navy text-white",
  cream: "bg-[#f8efdf] text-ink",
};

export default function ServiceCard({ title, desc, tone }) {
  return (
    <article className={`group rounded-[30px] border border-black/6 p-7 shadow-panel transition hover:-translate-y-1 ${toneMap[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-[-0.04em]">{title}</h3>
          <p className={`mt-4 max-w-sm text-sm leading-7 ${tone === "cream" ? "text-ink/70" : "text-white/78"}`}>{desc}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-full border text-lg transition group-hover:translate-x-1 ${tone === "cream" ? "border-black/12 text-ink/70" : "border-white/18 text-white/80"}`}>
          →
        </div>
      </div>
    </article>
  );
}
