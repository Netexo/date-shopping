import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/server/auth";
import AdminLogin from "../components/admin-login";
import "../admin.css";

export const metadata = { title: "Admin Login | Date Shopping", robots: { index: false, follow: false } };

async function LoginScreen() {
  if (await hasAdminSession()) redirect("/admin");
  return <AdminLogin />;
}

export default function AdminLoginPage() {
  return <Suspense fallback={<main className="admin-page admin-centered"><p>Anmeldung wird geladen.</p></main>}><LoginScreen /></Suspense>;
}
