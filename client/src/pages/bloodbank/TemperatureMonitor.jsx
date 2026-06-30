import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";

const ALERT_THRESHOLD = 6.0;

const TemperatureMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/temperature/mine?limit=20");
      setLogs(data.logs);
      setAlertCount(data.alertCount);
    } catch (err) {
      toast.error("Failed to load temperature history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data } = await api.post("/temperature/simulate");
      if (data.alertTriggered) {
        toast.error(`Cold-chain alert! Reading: ${data.temperature}°C`);
      } else {
        toast.success(`New reading: ${data.temperature}°C`);
      }
      fetchLogs();
    } catch (err) {
      toast.error("Failed to simulate reading");
    } finally {
      setSimulating(false);
    }
  };

  // Chart wants oldest-to-newest left-to-right; API returns newest-first
  const chartData = [...logs]
    .reverse()
    .map((l) => ({
      time: new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: l.temperature,
    }));

  const latest = logs[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Cold-Chain Monitor</h2>
          <p className="text-sm text-gray-400">Simulated IoT temperature sensor readings</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {simulating ? "Reading..." : "Simulate Reading"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Latest Reading</p>
          <p className={`text-xl font-bold ${latest?.alertTriggered ? "text-red-600" : "text-gray-700"}`}>
            {latest ? `${latest.temperature}°C` : "—"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Safe Threshold</p>
          <p className="text-xl font-bold text-gray-700">≤ {ALERT_THRESHOLD}°C</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Total Alerts</p>
          <p className={`text-xl font-bold ${alertCount > 0 ? "text-red-600" : "text-gray-700"}`}>{alertCount}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : chartData.length === 0 ? (
        <p className="text-gray-400 text-sm">No readings yet. Click "Simulate Reading" to generate one.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={ALERT_THRESHOLD} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Alert threshold", position: "insideTopRight", fontSize: 10, fill: "#dc2626" }} />
            <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TemperatureMonitor;