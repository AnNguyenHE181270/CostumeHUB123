import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * MainLayout — Master layout wrapper.
 * Wraps pages with Navbar + Footer.
 * Use with react-router-dom <Route element={<MainLayout />}>
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-body text-[#1a1a1a]">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
