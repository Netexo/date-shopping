import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Date Shopping",
  description: "Date Shopping",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
