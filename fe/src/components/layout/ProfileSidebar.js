import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom";
import { profile } from "../../constants/profile";
import { useAuth } from "../../context/AuthContext";

export default function ProfileSidebar({ handleLogout }) {
  const location = useLocation();
  const {user, role} = useAuth();
  console.log(user)
  return (
    <div className="lg:col-span-3 space-y-8">

      <div className="bg-white border border-[#eaeaea]">
        <ul className="flex flex-col">
          {profile.filter((item) => {
            
            if (!item.role || item.role === "all") return true;
            if (role == "online-customer" && item.role === "customer") return true;
            return item.role === role;
          }).map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.id} className={index !== 0 ? "border-t border-[#eaeaea]" : ""}>
                <div className="flex flex-col">
                  <Link 
                    to={item.path} 
                    className={`block px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase transition-colors border-l-4 ${
                      isActive 
                        ? "text-[#1a1a1a] bg-[#faf9f7] border-[#1a1a1a]" 
                        : "text-[#858585] hover:text-[#1a1a1a] hover:bg-[#faf9f7] border-transparent"
                    }`}
                  >
                    {item.title}
                  </Link>
                  {item.subMenu && isActive && (
                    <ul className="bg-[#faf9f7] py-2 border-t border-[#eaeaea]">
                      {item.subMenu.map((subItem) => {
                        const searchParam = subItem.path.split('?')[1];
                        const isSubActive = location.search.includes(searchParam) || (location.search === '' && subItem.id === 'all');
                        return (
                          <li key={subItem.id}>
                            <Link 
                              to={subItem.path} 
                              className={`block px-10 py-2 text-[12px] font-medium transition-colors ${
                                isSubActive ? "text-[#1a1a1a] font-bold" : "text-[#555] hover:text-[#1a1a1a]"
                              }`}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
          <li className="border-t border-[#eaeaea]">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-6 py-4 text-[13px] font-semibold tracking-[0.05em] uppercase text-red-600 hover:bg-red-50 transition-colors border-l-4 border-transparent"
            >
              Đăng xuất
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
