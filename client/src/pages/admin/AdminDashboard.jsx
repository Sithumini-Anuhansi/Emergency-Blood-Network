import { useState } from "react";
import { BarChart2, ClipboardList, Building2, Users } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import OverviewTab from "./OverviewTab";
import RequestsTab from "./RequestsTab";
import HospitalsTab from "./HospitalsTab";
import DonorsTab from "./DonorsTab";

const navItems = [
  { id: "overview",   label: "Overview",   icon: BarChart2 },
  { id: "requests",   label: "Requests",   icon: ClipboardList },
  { id: "hospitals",  label: "Hospitals",  icon: Building2 },
  { id: "donors",     label: "Donors",     icon: Users },
];

const AdminDashboard = () => {
  const [section, setSection] = useState("overview");

  return (
    <DashboardLayout navItems={navItems} activeSection={section} onSectionChange={setSection}>
      {section === "overview"  && <OverviewTab />}
      {section === "requests"  && <RequestsTab />}
      {section === "hospitals" && <HospitalsTab />}
      {section === "donors"    && <DonorsTab />}
    </DashboardLayout>
  );
};

export default AdminDashboard;