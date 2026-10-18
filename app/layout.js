import "./globals.css";

export const metadata = {
  title: "Date Shopping",
  description: "Date Shopping",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
