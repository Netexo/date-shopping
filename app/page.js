import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <h1 className="landing-title">Date Shopping</h1>
      <Link className="start-button" href="/calendar">
        Start
      </Link>
    </main>
  );
}
