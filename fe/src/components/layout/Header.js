import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faShoppingBag, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // Lấy đường dẫn hiện tại để active menu
  const activePath = location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-[16px] leading-[1.4] tracking-[-0.064px] font-medium text-text-primary">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            Luxe Rent
          </button>
        </div>

        {/* Right Section: Navigation Links + Actions */}
        <div className="flex items-center gap-6">
          
          {/* Navigation Links (từ file JSON) */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { id: 'shop', label: 'Shop', path: '/shop' },
              { id: 'collections', label: 'Collections', path: '/collections' },
              { id: 'about', label: 'About', path: '/about' },
              { id: 'contact', label: 'Contact', path: '/contact' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-[6px] transition-colors duration-200 text-[16px] leading-[1.4] tracking-[-0.064px] font-[450] text-text-primary hover:bg-surface ${
                  activePath.includes(item.path) ? 'bg-surface' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Icon Actions (Search, Cart, User) */}
          <div className="flex items-center gap-2 border-l border-border pl-6">
            <button className="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface rounded-[6px] transition-colors">
              <FontAwesomeIcon icon={faSearch} className="text-[15px]" />
            </button>
            
            <button className="relative w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface rounded-[6px] transition-colors">
              <FontAwesomeIcon icon={faShoppingBag} className="text-[15px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning-500 rounded-full"></span>
            </button>
            
            {token ? (
              <p className="ml-2 text-[15px] leading-[1.4] font-[450] text-text-primary truncate max-w-[120px]">
                {user?.fullName}
              </p>
            ) : (
              <button 
                className="ml-2 hidden md:flex items-center gap-2 bg-text-primary text-white px-4 py-2 rounded-[6px] text-[15px] font-[450] hover:bg-gray-800 transition-colors" 
                onClick={() => navigate('/login')}
              >
                <FontAwesomeIcon icon={faUser} className="text-[13px]" />
                Login
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}