import { useState } from "react";
import Navbar from "../../components/Navbar";
import OverviewTab from "./OverviewTab";
import RequestsTab from "./RequestsTab";
import HospitalsTab from "./HospitalsTab";
import DonorsTab from "./DonorsTab";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "requests", label: "Requests" },
  { id: "hospitals", label: "Hospitals" },
  { id: "donors", label: "Donors" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Admin Dashboard" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab nav */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "hospitals" && <HospitalsTab />}
        {activeTab === "donors" && <DonorsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;