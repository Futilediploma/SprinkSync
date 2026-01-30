
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import FieldForm from './components/FieldForm';
import SubmissionDetail from './components/SubmissionDetail';
import HomePage from './components/HomePage';
import SuccessPage from './components/SuccessPage';
import ManpowerForecast from './components/ManpowerForecast';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manpower" element={<ManpowerForecast />} />
        <Route path="/form/:shareToken" element={<FieldForm />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
