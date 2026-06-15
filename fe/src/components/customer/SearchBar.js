import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes, faHistory, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "../../utils/formatters";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem("costumehub_search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:9999"}/api/costumes?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.costumes || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const saveHistory = (term) => {
    if (!term.trim()) return;
    let newHistory = [term, ...history.filter(h => h !== term)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("costumehub_search_history", JSON.stringify(newHistory));
  };

  const removeHistoryItem = (term, e) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== term);
    setHistory(newHistory);
    localStorage.setItem("costumehub_search_history", JSON.stringify(newHistory));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    saveHistory(query.trim());
    setIsFocused(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleItemClick = (termOrProduct) => {
    const term = typeof termOrProduct === 'string' ? termOrProduct : termOrProduct.name;
    setQuery(term);
    saveHistory(term);
    setIsFocused(false);
    if (typeof termOrProduct === 'string') {
      navigate(`/search?q=${encodeURIComponent(term)}`);
    } else {
      navigate(`/product/${termOrProduct._id}`);
    }
  };

  const showDropdown = isFocused && (history.length > 0 || query.trim());

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[300px] lg:max-w-[400px]">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-gray-400 text-[14px]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Tìm kiếm trang phục, bộ sưu tập..."
          className="w-full bg-[#f9f5ed] border-none rounded-xl py-2.5 pl-10 pr-10 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e8dfc8] text-[#1a1a1a] transition-all"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-3 text-gray-400 hover:text-black">
            <FontAwesomeIcon icon={faTimes} className="text-[12px]" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-xl border border-[#eaeaea] overflow-hidden z-50">
          
          {/* Show History if query is empty */}
          {!query.trim() && history.length > 0 && (
            <div>
              <ul>
                {history.map((term, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#fafafa] cursor-pointer group border-b border-[#f5f5f5] last:border-0"
                    onClick={() => handleItemClick(term)}
                  >
                    <span className="text-[13px] text-[#333] truncate pr-4">{term}</span>
                    <button 
                      onClick={(e) => removeHistoryItem(term, e)} 
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Xóa khỏi lịch sử"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-[12px]" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Show Suggestions if query is not empty */}
          {query.trim() && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center p-6 text-gray-400">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-xl" />
                </div>
              ) : results.length > 0 ? (
                <ul>
                  {results.map(product => (
                    <li 
                      key={product._id} 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] cursor-pointer border-b border-[#f5f5f5] last:border-0"
                      onClick={() => handleItemClick(product)}
                    >
                      <img 
                        src={product.images?.[0] || "https://via.placeholder.com/150"} 
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded bg-[#f5f3f0] flex-shrink-0"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[13px] text-[#333] truncate">{product.name}</span>
                        <span className="text-[12px] text-[#f94a00] font-medium">
                          {formatPrice(product.pricePerDay || product.price || 0)}
                        </span>
                      </div>
                    </li>
                  ))}
                  {results.length >= 5 && (
                    <li 
                      className="px-4 py-3 text-center bg-[#fafafa] text-[12px] font-semibold text-[#666] hover:text-[#1a1a1a] cursor-pointer"
                      onClick={handleSearchSubmit}
                    >
                      Xem tất cả kết quả &rarr;
                    </li>
                  )}
                </ul>
              ) : (
                <div className="p-4 text-[13px] text-gray-500 text-center">
                  Không tìm thấy "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
