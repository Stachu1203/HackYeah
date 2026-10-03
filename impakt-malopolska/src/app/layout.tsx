import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { IssuesProvider } from "@/lib/issues-context";
import { RoleProvider } from "@/lib/role-context";
import "./globals.css";

/* Inter only as fallback — body prefers system/SF via CSS */
const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ImpaktMałopolska",
  description:
    "Zgłoś problem ze zdjęciem i lokalizacją. Sąsiedzi popierają — urząd widzi heatmapę.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <RoleProvider>
          <IssuesProvider>
            <SiteNav />
            <main className="flex flex-1 flex-col">{children}</main>
          </IssuesProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
