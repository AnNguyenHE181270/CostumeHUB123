import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faTimes } from "@fortawesome/free-solid-svg-icons";

const Toast = ({ message, type = "success", isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-20 right-6 z-[100] flex items-center p-4 rounded-lg shadow-xl border animate-bounce-in ${
        type === "success" ? "text-green-800 border-green-300 bg-green-50" : "text-red-800 border-red-300 bg-red-50"
      }`} 
      role="alert"
    >
      <FontAwesomeIcon 
        icon={type === "success" ? faCheckCircle : faExclamationCircle} 
        className={`w-5 h-5 mr-3 ${type === "success" ? "text-green-500" : "text-red-500"}`} 
      />
      <div className="font-medium pr-8">{message}</div>
      <button 
        type="button" 
        onClick={onClose} 
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center transition-colors focus:outline-none ${
          type === "success" ? "text-green-500 hover:bg-green-100" : "text-red-500 hover:bg-red-100"
        }`}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

      <style>{`
        @keyframes bounceIn {
          0% { opacity: 0; transform: translateX(100%); }
          60% { opacity: 1; transform: translateX(-10%); }
          80% { transform: translateX(5%); }
          100% { transform: translateX(0); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
