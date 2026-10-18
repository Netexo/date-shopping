export const YEAR = 2026;
export const MONTH = 9; // JavaScript months start at zero.
export const SPECIAL_DAY = 27;

// Use UTC explicitly so the weekday never changes with the visitor's timezone.
export function formatDate(day) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(YEAR, MONTH, day)));
}

export function monthCells() {
  const offset = (new Date(Date.UTC(YEAR, MONTH, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(YEAR, MONTH + 1, 0)).getUTCDate();
  const length = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(YEAR, MONTH, index - offset + 1));
    return { day: date.getUTCDate(), currentMonth: date.getUTCMonth() === MONTH };
  });
}

export const initialSelection = {
  phase: "calendar", pendingDay: null, day: null, promptIndex: 0, time: "",
};

export function plannerReducer(state, action) {
  switch (action.type) {
    case "select":
      if (state.phase !== "calendar" || !Number.isInteger(action.day) || action.day < 1 || action.day > 31) return state;
      return {
        ...initialSelection,
        pendingDay: action.day,
        day: action.day === SPECIAL_DAY ? SPECIAL_DAY : null,
        phase: action.day === SPECIAL_DAY ? "time" : "persuade",
      };
    case "keep":
      if (state.phase !== "persuade") return state;
      return state.promptIndex < 2
        ? { ...state, promptIndex: state.promptIndex + 1 }
        : { ...state, day: state.pendingDay, phase: "time" };
    case "switch":
      return state.phase === "persuade" ? { ...state, day: SPECIAL_DAY, phase: "time" } : state;
    case "cancel":
      return state.phase === "persuade" ? { ...initialSelection } : state;
    case "confirm":
      return state.phase === "time" && /^([01]\d|2[0-3]):[0-5]\d$/.test(action.time)
        ? { ...state, time: action.time, phase: "confirmed" }
        : state;
    default:
      return state;
  }
}
