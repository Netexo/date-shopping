import { formatDate, monthCells, SPECIAL_DAY } from "../lib/planner";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const cells = monthCells();

export default function MonthCalendar({ onSelect }) {
  return (
    <section className="month-calendar" aria-labelledby="month-title">
      <header className="month-header">
        <h1 id="month-title">Oktober <span>2026</span></h1>
        <span className="month-label">Ein guter Monat für ein Date.</span>
      </header>
      <div className="weekdays" aria-hidden="true">
        {weekdays.map((day) => <span key={day}><span className="weekday-full">{day}</span><span className="weekday-short">{day.slice(0, 2)}</span></span>)}
      </div>
      <div className="month-grid">
        {cells.map(({ day, currentMonth }, index) => {
          const special = currentMonth && day === SPECIAL_DAY;
          if (!currentMonth) return <div className="day-cell outside-month" key={index} aria-hidden="true"><span className="day-number">{day}</span></div>;
          return (
            <button
              key={index}
              type="button"
              className={`day-cell${special ? " special-day" : ""}${index % 7 >= 5 ? " weekend" : ""}`}
              onClick={() => onSelect(day)}
              aria-label={`${formatDate(day)}${special ? ": Nick Praktikum zu Ende!" : " auswählen"}`}
            >
              <span className="day-number">{day}</span>
              {special && <span className="special-event">Nick Praktikum zu Ende!</span>}
            </button>
          );
        })}
      </div>
      <button type="button" className="mobile-event" onClick={() => onSelect(SPECIAL_DAY)} aria-label="Dienstag, 27. Oktober 2026 auswählen: Nick Praktikum zu Ende!">
        <span className="mobile-event-date">27<span>OKT</span></span>
        <span>Nick Praktikum zu Ende!</span>
      </button>
    </section>
  );
}
