import React from "react";

export default function ErrorMessage({ message, className = "" }) {
  if (!message) return null;

  return (
    <p className={`text-warning-600 text-sm mt-1.5 ${className}`}>
      {message}
    </p>
  );
}