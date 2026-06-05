import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

/**
 * MainLayout — Master layout wrapper.
 * Wraps pages with Header + Footer.
 * Use with react-router-dom <Route element={<MainLayout />}>
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-body text-[#1a1a1a]">
      <Header />

      <main className="flex-1 pt-[88px] bg-white">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
