import React from "react";

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <p className="text-deep-crimson text-[13px] mt-1 animate-fade-in">
      {message}
    </p>
  );
}