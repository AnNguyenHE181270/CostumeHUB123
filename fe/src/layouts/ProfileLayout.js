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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Hồ Sơ Của Tôi
          </h1>
          <p className="text-[14px] text-[#858585]">
            Quản lý thông tin cá nhân và tài khoản của bạn.
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
          {(roleName === "owner" || roleName === "staff") && (
            <Link 
              to={roleName === "owner" ? "/owner" : "/staff"} 
              className="bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.1em] font-semibold px-6 py-3 hover:bg-[#333] transition-colors flex items-center justify-center border border-[#1a1a1a] w-full sm:w-auto"
            >
              Trang Quản Trị
            </Link>
          )}
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <ProfileSidebar handleLogout={handleLogout} />

        {/* Right Column: Content */}
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
