import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Notification from "@/components/Notification";
import Dashboard from "@/pages/Dashboard";
import Sites from "@/pages/Sites";
import Bookings from "@/pages/Bookings";
import Rates from "@/pages/Rates";
import Bills from "@/pages/Bills";

export default function App() {
  return (
    <Router>
      <Notification />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/rates" element={<Rates />} />
          <Route path="/bills" element={<Bills />} />
        </Route>
      </Routes>
    </Router>
  );
}
