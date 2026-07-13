export default function DataTable({ children, isLoading, isEmpty, emptyMessage = "No data found.", footer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
        <table className="w-full text-left table-fixed">
          {children}
        </table>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading data...</div>
      ) : isEmpty ? (
        <div className="text-center py-8 text-gray-400 text-sm">{emptyMessage}</div>
      ) : null}

      {!isLoading && !isEmpty && footer}
    </div>
  );
}