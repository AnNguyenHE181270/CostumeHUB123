import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faMapMarkerAlt, faShoppingBag, faClock } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom";
import { profile } from "../../constants/profile";
import { useAuth } from "../../context/AuthContext";

const getItemIcon = (id) => {
  switch (id) {
    case "my-profile":
      return faUser;
    case "address":
      return faMapMarkerAlt;
    case "orders":
      return faShoppingBag;
    case "transactions":
      return faClock;
    default:
      return faUser;
  }
};

export default function ProfileSidebar({ handleLogout, className = "space-y-8" }) {
  const location = useLocation();
  const {user, role} = useAuth();
  console.log(user)
  return (
    <div className={className}>

      <div className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-sm">
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
                    className={`flex items-center gap-4 px-6 py-6 text-[13px] font-semibold tracking-[0.05em] uppercase transition-colors border-l-4 ${
                      isActive 
                        ? "text-[#1a1a1a] bg-[#fcfaf5] border-[#1a1a1a]" 
                        : "text-[#858585] hover:text-[#1a1a1a] hover:bg-[#faf9f7] border-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
                      isActive 
                        ? "bg-white text-[#1a1a1a] border-[#1a1a1a]" 
                        : "bg-transparent text-[#858585] border-[#eaeaea]"
                    }`}>
                      <FontAwesomeIcon icon={getItemIcon(item.id)} className="text-xs" />
                    </div>
                    <span>{item.title}</span>
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
        </ul>
      </div>
    </div>
  );
}
