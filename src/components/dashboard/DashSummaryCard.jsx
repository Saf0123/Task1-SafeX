import { useEffect, useState } from 'react'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

function DashSummaryCard({ label, value, Icon, accent, trendDir, trendText, barPercent, onClick }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    let startTime = null
    const duration = 700
    const target = value

    const animate = (ts) => {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }

    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [value])

  const trendClass =
    trendDir === 'up' ? 'dash-summary-card__trend--up'
    : trendDir === 'down' ? 'dash-summary-card__trend--down'
    : 'dash-summary-card__trend--neutral'

  return (
    <article
      className="dash-summary-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="dash-summary-card__header">
        <div
          className="dash-summary-card__icon"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {Icon && <Icon size={17} />}
        </div>
        {trendText && (
          <span className={`dash-summary-card__trend ${trendClass}`}>
            {trendDir === 'up' && <FiTrendingUp size={9} />}
            {trendDir === 'down' && <FiTrendingDown size={9} />}
            {trendText}
          </span>
        )}
      </div>
      <p className="dash-summary-card__value" style={{ color: accent }}>{displayed}</p>
      <p className="dash-summary-card__label">{label}</p>
      <div className="dash-summary-card__bar">
        <div
          className="dash-summary-card__bar-fill"
          style={{ width: `${Math.min(barPercent || 0, 100)}%`, background: accent }}
        />
      </div>
    </article>
  )
}

export default DashSummaryCard
