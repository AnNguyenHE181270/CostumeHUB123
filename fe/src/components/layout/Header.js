import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faShoppingBag, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function Header() {

    const navigate = useNavigate();
    const {user} = useAuth()
    const token = localStorage.getItem("token")
  return (
    <header className="sticky top-0 z-50 bg-canvas-white/90 backdrop-blur-lg border-b border-sterling-gray/50">
      <div className="mx-auto max-w-[1200px] flex items-center justify-between h-16 px-6">
  
        <a href="/" className="text-abyssal-black font-medium tracking-[-0.02em]" style={{ fontSize: '20px' }}>
          CostumeHUB
        </a>

        
        <nav className="hidden md:flex items-center gap-2">
          {["Collections", "Services", "About Us", "Lookbook"].map((item) => (
            <a 
              key={item} 
              href="#" 
              className="px-4 py-2 text-[16px] font-normal text-midnight-ink hover:bg-ghost-fog rounded-navigation transition-colors" 
              style={{ letterSpacing: '-0.064px' }}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-ghost-fog rounded-full transition-colors">
            <FontAwesomeIcon icon={faSearch} className="text-[16px]" />
          </button>
          <button className="relative w-10 h-10 flex items-center justify-center hover:bg-ghost-fog rounded-full transition-colors">
            <FontAwesomeIcon icon={faShoppingBag} className="text-[16px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning-orange rounded-full"></span>
          </button>
          
          {/* Nút Login/Logout - Bạn có thể dùng useAuth() ở đây để đổi chữ Login/Avatar */}
          {token ? <p>{user?.fullName} </p>:<button className="hidden md:flex items-center gap-2 bg-abyssal-black text-canvas-white px-4 py-2 rounded-specialButtons text-[14px] font-medium hover:bg-midnight-ink transition-colors" onClick={(e) => (navigate('/login'))}>
            <FontAwesomeIcon icon={faUser} className="text-[12px]" />
            Login
          </button>}
        </div>
      </div>
    </header>
  );
}