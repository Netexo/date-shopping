"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { formatDate, initialSelection, plannerReducer, YEAR, MONTH } from "../lib/planner";
import MonthCalendar from "./month-calendar";
import SelectionDialog from "./selection-dialog";
import TimePicker from "./time-picker";

export default function DatePlanner() {
  const [selection, dispatch] = useReducer(plannerReducer, initialSelection);
  const [month, setMonth] = useState(MONTH);
  const contentRef = useRef(null);

  useEffect(() => {
    if (selection.phase === "time" || selection.phase === "confirmed") {
      contentRef.current.querySelector("h1")?.focus();
    }
  }, [selection.phase]);

  return (
    <main className="planner-shell">
      <nav className="planner-nav" aria-label="Hauptnavigation"><Link href="/">Date Shopping</Link><span>Ein Date beginnt mit einem Datum.</span></nav>
      <div className={`planner-content${["time", "confirmed"].includes(selection.phase) ? " centered" : ""}`} ref={contentRef}>
        {["calendar", "persuade"].includes(selection.phase) && (
          <MonthCalendar month={month} onMonthChange={setMonth} onSelect={(day) => dispatch({ type: "select", day, month })} />
        )}
        {selection.phase === "persuade" && <SelectionDialog step={selection.promptIndex} pendingDay={selection.pendingDay} month={selection.month} onSwitch={() => dispatch({ type: "switch" })} onKeep={() => dispatch({ type: "keep" })} onCancel={() => dispatch({ type: "cancel" })} />}
        {selection.phase === "time" && <TimePicker day={selection.day} month={selection.month} onConfirm={(time) => dispatch({ type: "confirm", time })} />}
        {selection.phase === "confirmed" && <section className="planner-step confirmation" aria-labelledby="confirmation-heading">
          <h1 id="confirmation-heading" tabIndex={-1}>It&apos;s a date!</h1>
          <p className="confirmed-date">{formatDate(selection.day, selection.month)}<br /><span>{selection.time} Uhr</span></p>
          <Link className="planner-button planner-shop-link" href={{
            pathname: "/shop",
            query: {
              date: `${YEAR}-${String(selection.month + 1).padStart(2, "0")}-${String(selection.day).padStart(2, "0")}`,
              time: selection.time,
            },
          }}>Continue Shopping</Link>
        </section>}
      </div>
    </main>
  );
}
