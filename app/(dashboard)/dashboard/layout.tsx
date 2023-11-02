import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import Header from "@/components/layout/Header/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Shadcn",
  description: "Basic dashboard with Next.js and Shadcn",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="w-1/6" />
        <main className="grow pt-16 ">{children}</main>
      </div>
    </>
  );
}
