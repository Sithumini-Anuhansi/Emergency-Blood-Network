import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";

const DonorsTab = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/donors/all", { params: { page, limit: 15 } });
      setDonors(data.donors);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error("Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">{total} registered donor{total === 1 ? "" : "s"}</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-sm">Loading...</p>
        ) : donors.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No donors registered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Blood Group</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Total Donations</th>
                <th className="px-4 py-3 font-medium">Availability</th>
                <th className="px-4 py-3 font-medium">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donors.map((d) => (
                <tr key={d._id}>
                  <td className="px-4 py-3 text-gray-700 font-medium">{d.userId?.fullName}</td>
                  <td className="px-4 py-3 font-semibold text-brand-600">{d.bloodGroup}</td>
                  <td className="px-4 py-3 text-gray-500">{d.userId?.district}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.userId?.email}
                    <br />
                    <span className="text-xs text-gray-400">{d.userId?.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{d.totalDonations}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={d.availability ? "fulfilled" : "cancelled"} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={d.eligibility ? "fulfilled" : "cancelled"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DonorsTab;