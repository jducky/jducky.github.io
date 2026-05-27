export default function ProjectCard({ title, subtitle, accent }) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-black/6 bg-white shadow-panel">
      <div className={`h-44 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_42%),linear-gradient(135deg,_${accent[0]},_${accent[1]})]`} />
      <div className="px-5 py-5">
        <h3 className="text-lg font-bold tracking-[-0.03em] text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink/64">{subtitle}</p>
      </div>
    </article>
  );
}
