import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import StaffLayout from './components/StaffLayout';
import ModelLayout from './components/ModelLayout';
import StaffDashboard from './pages/staff/Dashboard';
import StaffRequests from './pages/staff/Requests';
import StaffContent from './pages/staff/Content';
import EOD from './pages/EOD';
import StaffAudits from './pages/staff/Audits';
import StaffInvoices from './pages/staff/Invoices';
import StaffModels from './pages/staff/Models';
import StaffVoice from './pages/staff/VoiceNotes';
import StaffShifts from './pages/staff/Shifts';
import StaffCalendar from './pages/staff/Calendar';
import ModelDashboard from './pages/model/Dashboard';
import ModelRequests from './pages/model/Requests';
import ModelContent from './pages/model/Content';
import ModelInvoices from './pages/model/Invoices';
import ModelVoice from './pages/model/VoiceNotes';

function Protected({ children, staffOnly, modelOnly }) {
  const { user, loading, isStaff, isModel } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (staffOnly && !isStaff) return <Navigate to="/model" replace />;
  if (modelOnly && !isModel) return <Navigate to="/staff" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
            <Route path="/staff" element={<Protected staffOnly><StaffLayout /></Protected>}>
        <Route index element={<StaffDashboard />} />
        <Route path="requests" element={<StaffRequests />} />
        <Route path="content" element={<StaffContent />} />
        <Route path="audits" element={<StaffAudits />} />
        <Route path="invoices" element={<StaffInvoices />} />
        <Route path="models" element={<StaffModels />} />
        <Route path="voice" element={<StaffVoice />} />
        <Route path="shifts" element={<StaffShifts />} />
        <Route path="calendar" element={<StaffCalendar />} />
        <Route path="eod" element={<EOD />} />
      </Route>
      <Route path="/model" element={<Protected modelOnly><ModelLayout /></Protected>}>
        <Route index element={<ModelDashboard />} />
        <Route path="requests" element={<ModelRequests />} />
        <Route path="content" element={<ModelContent />} />
        <Route path="invoices" element={<ModelInvoices />} />
        <Route path="voice" element={<ModelVoice />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
