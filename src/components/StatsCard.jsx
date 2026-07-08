function StatsCard({ label, value, detail, accent }) {
  return (
    <article className="stats-card">
      <div className="stats-card__top">
        <p>{label}</p>
        <span className="dot" style={{ background: accent }} />
      </div>
      <h3>{value}</h3>
      <p className="stats-card__detail">{detail}</p>
    </article>
  )
}

export default StatsCard
