import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import toast from "react-hot-toast";
import { Thermometer, AlertTriangle, Activity, Droplets } from "lucide-react";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";

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
    } catch { toast.error("Failed to load temperature data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data } = await api.post("/temperature/simulate");
      data.alertTriggered
        ? toast.error(`Alert! ${data.temperature}°C — exceeds safe threshold`)
        : toast.success(`Reading recorded: ${data.temperature}°C`);
      fetchLogs();
    } catch { toast.error("Failed to simulate reading"); }
    finally { setSimulating(false); }
  };

  const latest = logs[0];
  const chartData = [...logs].reverse().map(l => ({
    time: new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature: l.temperature,
  }));

  const avgTemp = logs.length ? (logs.reduce((a, b) => a + b.temperature, 0) / logs.length).toFixed(1) : null;
  const maxTemp = logs.length ? Math.max(...logs.map(l => l.temperature)) : null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Latest Reading" value={latest ? `${latest.temperature}°C` : "—"} icon={Thermometer} accent={latest?.alertTriggered ? "#ef4444" : "#059669"} />
        <StatCard label="Avg Temperature" value={avgTemp ? `${avgTemp}°C` : "—"} icon={Activity} accent="#059669" />
        <StatCard label="Max Recorded" value={maxTemp ? `${maxTemp}°C` : "—"} icon={Droplets} accent="#f59e0b" />
        <StatCard label="Total Alerts" value={alertCount} icon={AlertTriangle} accent="#ef4444" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col card-bank overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-700">Cold-Chain Temperature Trend</h2>
            <p className="text-xs text-slate-400">Safe range: 2–{ALERT_THRESHOLD}°C · {logs.length} readings</p>
          </div>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <Thermometer size={12} />
            {simulating ? "Reading..." : "Simulate Reading"}
          </button>
        </div>
        <div className="flex-1 p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No readings yet. Click "Simulate Reading" to begin.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={ALERT_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Alert threshold", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
                <Line type="monotone" dataKey="temperature" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: "#059669" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemperatureMonitor;