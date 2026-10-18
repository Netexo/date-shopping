import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../lib/server/auth";
import AdminDashboard from "./components/admin-dashboard";
import "./admin.css";

export const metadata = { title: "Admin | Date Shopping", robots: { index: false, follow: false } };

async function ProtectedDashboard() {
  if (!await hasAdminSession()) redirect("/admin/login");
  return <AdminDashboard />;
}

export default function AdminPage() {
  return <Suspense fallback={<main className="admin-page admin-centered"><p>Dashboard wird geladen.</p></main>}><ProtectedDashboard /></Suspense>;
}
