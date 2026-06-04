import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import { useState } from "react";
export default function NavLinkSideBar({ item, collapsed }) {
  const [isActive, setIsActive] = useState(false)
  const location = useLocation();
  if(item.path + item.end == location.pathname){
    setIsActive(true)
  }
  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={item.label}
      className={({ isActive }) =>
        `
        flex items-center
        px-4 py-3 rounded-xl
        transition-all duration-200
        gap-3
        ${
          isActive
            ? "bg-[#1a1a1a] text-white shadow-md"
            : "hover:bg-[#f0f0f0] text-[#474747]"
        }
        ${collapsed ? "justify-center px-0" : ""} 
        `
      }
    >
      <FontAwesomeIcon icon={item.icon} className="text-lg" />

      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}