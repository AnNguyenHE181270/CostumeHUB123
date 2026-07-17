import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
  wrapperClassName = "w-full md:w-2/6",
  ...props
}) {
  return (
    <div className={`relative ${wrapperClassName} ${className}`}>
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent text-sm bg-white"
        {...props}
      />
    </div>
  );
}
