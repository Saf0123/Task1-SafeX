import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi'

function parseWeekNum(weekStr) {
  return parseInt(String(weekStr || '').replace('Week-', ''), 10) || 1
}

function DashWeekNav({ currentWeek, taskCount, onPrev, onNext, onReset }) {
  const weekNum = parseWeekNum(currentWeek)

  return (
    <div className="dash-week-nav">
      <div className="dash-week-nav__info">
        <div className="dash-week-nav__icon">
          <FiCalendar size={20} />
        </div>
        <div className="dash-week-nav__label">
          <p className="dash-week-nav__eyebrow">Current Period</p>
          <p className="dash-week-nav__title">Week {weekNum}</p>
          <p className="dash-week-nav__count">
            {taskCount} task{taskCount !== 1 ? 's' : ''} in this period
          </p>
        </div>
      </div>

      <div className="dash-week-nav__controls">
        <button
          type="button"
          className="dash-week-nav__reset"
          onClick={onReset}
          title="Go to Week 1"
        >
          <FiCalendar size={13} />
          Week 1
        </button>
        <button
          type="button"
          className="dash-week-nav__btn"
          onClick={onPrev}
          disabled={weekNum <= 1}
          aria-label="Previous week"
          title="Previous week"
        >
          <FiChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="dash-week-nav__btn"
          onClick={onNext}
          disabled={weekNum >= 12}
          aria-label="Next week"
          title="Next week"
        >
          <FiChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default DashWeekNav
