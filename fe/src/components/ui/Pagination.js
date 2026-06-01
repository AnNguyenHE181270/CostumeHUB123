export default function Pagination({
  displayCount = 0,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) {
  if (totalCount === 0) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium">{displayCount}</span>{" "}
        of{" "}
        <span className="font-medium">{totalCount}</span>{" "}
        results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === currentPage
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}