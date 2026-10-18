"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef } from "react";
import { formatDate, initialSelection, plannerReducer, YEAR, MONTH } from "../lib/planner";
import MonthCalendar from "./month-calendar";
import SelectionDialog from "./selection-dialog";
import TimePicker from "./time-picker";

export default function DatePlanner() {
  const [selection, dispatch] = useReducer(plannerReducer, initialSelection);
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
          <MonthCalendar onSelect={(day) => dispatch({ type: "select", day })} />
        )}
        {selection.phase === "persuade" && <SelectionDialog step={selection.promptIndex} pendingDay={selection.pendingDay} onSwitch={() => dispatch({ type: "switch" })} onKeep={() => dispatch({ type: "keep" })} onCancel={() => dispatch({ type: "cancel" })} />}
        {selection.phase === "time" && <TimePicker day={selection.day} onConfirm={(time) => dispatch({ type: "confirm", time })} />}
        {selection.phase === "confirmed" && <section className="planner-step confirmation" aria-labelledby="confirmation-heading">
          <h1 id="confirmation-heading" tabIndex={-1}>It&apos;s a date!</h1>
          <p className="confirmed-date">{formatDate(selection.day)}<br /><span>{selection.time} Uhr</span></p>
          <Link className="planner-button planner-shop-link" href={{
            pathname: "/shop",
            query: {
              date: `${YEAR}-${String(MONTH + 1).padStart(2, "0")}-${String(selection.day).padStart(2, "0")}`,
              time: selection.time,
            },
          }}>Continue Shopping</Link>
        </section>}
      </div>
    </main>
  );
}
