import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewMatch — Find your people. Build what matters.",
  description: "Discover collaborators for hackathons, projects, startups, and open source.",
  applicationName: "CrewMatch"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
