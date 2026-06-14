import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

/**
 * MainLayout — Master layout wrapper.
 * Wraps pages with Header + Footer.
 * Use with react-router-dom <Route element={<MainLayout />}>
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-body text-[#1a1a1a]">
      <Header />

      <main className="flex-1 pt-[104px] bg-gray-200">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
