import { formatDate, monthCells, SPECIAL_DAY, MONTH, YEAR, isSelectableDay } from "../lib/planner";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function MonthCalendar({ month, onMonthChange, onSelect }) {
  const cells = monthCells(month);
  return (
    <section className="month-calendar" aria-labelledby="month-title">
      <header className="month-header">
        <h1 id="month-title">{month === MONTH ? "Oktober" : "November"} <span>{YEAR}</span></h1>
        <div className="month-navigation" aria-label="Monat wechseln">
          <button type="button" disabled={month === MONTH} onClick={() => onMonthChange(MONTH)} aria-label="Vorheriger Monat">‹</button>
          <button type="button" disabled={month === MONTH + 1} onClick={() => onMonthChange(MONTH + 1)} aria-label="Nächster Monat">›</button>
        </div>
        <span className="month-label">Sonntag und Montag sind gesperrt.</span>
      </header>
      <div className="weekdays" aria-hidden="true">
        {weekdays.map((day) => <span key={day}><span className="weekday-full">{day}</span><span className="weekday-short">{day.slice(0, 2)}</span></span>)}
      </div>
      <div className="month-grid">
        {cells.map(({ day, currentMonth }, index) => {
          const special = currentMonth && month === MONTH && day === SPECIAL_DAY;
          if (!currentMonth) return <div className="day-cell outside-month" key={index} aria-hidden="true"><span className="day-number">{day}</span></div>;
          const blocked = !isSelectableDay(day, month);
          return (
            <button
              key={index}
              type="button"
              className={`day-cell${special ? " special-day" : ""}${index % 7 >= 5 ? " weekend" : ""}`}
              disabled={blocked}
              onClick={() => onSelect(day)}
              aria-label={`${formatDate(day, month)}${special ? ": Nick Praktikum zu Ende!" : blocked ? ": gesperrt" : " auswählen"}`}
            >
              <span className="day-number">{day}</span>
              {blocked && <span className="blocked-day-marker" aria-hidden="true"><span className="blocked-day-cross">×</span><span className="blocked-day-label">Gesperrt</span></span>}
              {special && <span className="special-event">Nick Praktikum zu Ende!</span>}
            </button>
          );
        })}
      </div>
      {month === MONTH && <button type="button" className="mobile-event" onClick={() => onSelect(SPECIAL_DAY)} aria-label="Dienstag, 27. Oktober 2026 auswählen: Nick Praktikum zu Ende!">
        <span className="mobile-event-date">27<span>OKT</span></span>
        <span>Nick Praktikum zu Ende!</span>
      </button>}
    </section>
  );
}
