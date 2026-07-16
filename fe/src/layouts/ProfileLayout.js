import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import ProfileSidebar from '../components/layout/ProfileSidebar';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function ProfileLayout() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleName = role?.name || role || "";

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-12 py-12 md:py-20 font-body">
      <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
        {/* Left Column: Header & Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Hồ Sơ Của Tôi
            </h1>
          </div>
          <ProfileSidebar handleLogout={handleLogout} className="space-y-8" />
        </div>

        {/* Right Column: Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
