export const YEAR = 2026;
export const MONTH = 9; // JavaScript months start at zero.
export const SPECIAL_DAY = 27;

// Use UTC explicitly so the weekday never changes with the visitor's timezone.
export function formatDate(day, month = MONTH) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(YEAR, month, day)));
}

export function monthCells(month = MONTH) {
  const offset = (new Date(Date.UTC(YEAR, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(YEAR, month + 1, 0)).getUTCDate();
  const length = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(YEAR, month, index - offset + 1));
    return { day: date.getUTCDate(), currentMonth: date.getUTCMonth() === month };
  });
}

export function isSelectableDay(day, month = MONTH) {
  if (![MONTH, MONTH + 1].includes(month) || !Number.isInteger(day) || day < 1) return false;
  const date = new Date(Date.UTC(YEAR, month, day));
  return date.getUTCMonth() === month && ![0, 1].includes(date.getUTCDay());
}

export const initialSelection = {
  month: MONTH, phase: "calendar", pendingDay: null, day: null, promptIndex: 0, time: "",
};

export function plannerReducer(state, action) {
  switch (action.type) {
    case "select":
      if (state.phase !== "calendar" || !isSelectableDay(action.day, action.month ?? MONTH)) return state;
      return {
        ...initialSelection,
        month: action.month ?? MONTH,
        pendingDay: action.day,
        day: action.day === SPECIAL_DAY && (action.month ?? MONTH) === MONTH ? SPECIAL_DAY : null,
        phase: action.day === SPECIAL_DAY && (action.month ?? MONTH) === MONTH ? "time" : "persuade",
      };
    case "keep":
      if (state.phase !== "persuade") return state;
      return state.promptIndex < 2
        ? { ...state, promptIndex: state.promptIndex + 1 }
        : { ...state, day: state.pendingDay, phase: "time" };
    case "switch":
      return state.phase === "persuade" ? { ...state, month: MONTH, day: SPECIAL_DAY, phase: "time" } : state;
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
