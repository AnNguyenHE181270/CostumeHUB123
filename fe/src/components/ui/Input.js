export default function Input({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-muted-slate">
        {label}
        {required && <span className="text-sunset-orange ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

