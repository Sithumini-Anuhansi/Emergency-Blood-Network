const StatCard = ({ label, value, icon: Icon, accent = "#64748b", sub }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: accent + "18" }}
    >
      <Icon size={18} style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="num text-xl font-bold text-slate-800 leading-tight">{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default StatCard;