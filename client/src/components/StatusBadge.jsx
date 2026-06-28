const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700",
  matched: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  // urgency variants
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
  // inventory variants
  available: "bg-green-100 text-green-700",
  reserved: "bg-blue-100 text-blue-700",
  expired: "bg-red-100 text-red-700",
  used: "bg-gray-100 text-gray-500",
};

const StatusBadge = ({ value }) => {
  const style = statusStyles[value] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {value}
    </span>
  );
};

export default StatusBadge;