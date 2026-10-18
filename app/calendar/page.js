import DatePlanner from "./components/date-planner";
import "./calendar.css";

export const metadata = {
  title: "Terminplaner | Date Shopping",
  description: "Finde ein Datum und eine Uhrzeit für unser Date.",
};

export default function CalendarPage() {
  return <DatePlanner />;
}
