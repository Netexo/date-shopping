import test from "node:test";
import assert from "node:assert/strict";
import { initialSelection, plannerReducer, monthCells, formatDate, isSelectableDay } from "../app/calendar/lib/planner.js";

const select = (day) => plannerReducer(initialSelection, { type: "select", day });
const act = (state, type) => plannerReducer(state, { type });

test("October grid starts on Thursday and puts October 27 on Tuesday", () => {
  const cells = monthCells();
  assert.equal(cells.length, 35);
  assert.equal(cells.filter((cell) => cell.currentMonth).length, 31);
  assert.equal(cells.findIndex((cell) => cell.currentMonth && cell.day === 1), 3);
  assert.equal(cells.findIndex((cell) => cell.currentMonth && cell.day === 27) % 7, 1);
  assert.equal(formatDate(27), "Dienstag, 27. Oktober 2026");
});

test("the 27th goes straight to the time picker", () => {
  const state = select(27);
  assert.equal(state.phase, "time");
  assert.equal(state.day, 27);
});

test("every other day is preserved after exactly three refusals", () => {
  for (let day = 1; day <= 31; day++) {
    if (day === 27 || !isSelectableDay(day)) continue;
    let state = select(day);
    for (let prompt = 0; prompt < 3; prompt++) {
      assert.equal(state.phase, "persuade");
      assert.equal(state.promptIndex, prompt);
      assert.equal(state.pendingDay, day);
      state = act(state, "keep");
    }
    assert.equal(state.phase, "time");
    assert.equal(state.day, day);
    assert.deepEqual(act(state, "keep"), state);
  }
});

test("accepting the 27th works at each prompt; cancellation resets the prompt sequence", () => {
  for (let step = 0; step < 3; step++) {
    let state = select(13);
    for (let i = 0; i < step; i++) state = act(state, "keep");
    const switched = act(state, "switch");
    assert.equal(switched.day, 27);
    assert.equal(switched.phase, "time");
    assert.deepEqual(act(state, "cancel"), initialSelection);
    assert.equal(plannerReducer(act(state, "cancel"), { type: "select", day: 6 }).promptIndex, 0);
  }
});

test("confirmation retains the chosen date and accepts valid 24-hour times only", () => {
  const state = act(act(act(select(31), "keep"), "keep"), "keep");
  for (const time of ["00:00", "18:07", "23:59"]) {
    const confirmed = plannerReducer(state, { type: "confirm", time });
    assert.equal(confirmed.phase, "confirmed");
    assert.equal(confirmed.day, 31);
    assert.equal(confirmed.time, time);
  }
  for (const time of ["", "24:00", "12:60", "9:00"]) {
    assert.deepEqual(plannerReducer(state, { type: "confirm", time }), state);
  }
});


test("November dates retain their month through confirmation and switching", () => {
  assert.equal(monthCells(10).filter((cell) => cell.currentMonth).length, 30);
  assert.equal(formatDate(3, 10), "Dienstag, 3. November 2026");
  let state = plannerReducer(initialSelection, { type: "select", day: 3, month: 10 });
  assert.equal(act(state, "switch").month, 9);
  for (let i = 0; i < 3; i++) state = act(state, "keep");
  state = plannerReducer(state, { type: "confirm", time: "18:00" });
  assert.equal(state.month, 10);
  assert.equal(state.day, 3);
  assert.equal(state.phase, "confirmed");
});

test("Sundays, Mondays and invalid dates cannot be selected in either month", () => {
  for (const month of [9, 10]) {
    for (let day = 1; day <= 31; day++) {
      const date = new Date(Date.UTC(2026, month, day));
      const blocked = date.getUTCMonth() !== month || [0, 1].includes(date.getUTCDay());
      assert.equal(isSelectableDay(day, month), !blocked);
      if (blocked) assert.equal(plannerReducer(initialSelection, { type: "select", day, month }), initialSelection);
    }
  }
});
