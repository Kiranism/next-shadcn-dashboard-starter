import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import Header from "@/components/layout/Header/Header";
import { MobileSidebar } from "@/components/layout/Sidebar/mobile-sidebar";

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
      <div className="flex h-screen">
        <Sidebar className="w-1/6 hidden md:block" />
        <main className="grow pt-16">{children}</main>
      </div>
    </>
  );
}
