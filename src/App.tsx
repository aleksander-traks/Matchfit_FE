import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IntakeProvider } from './context/IntakeContext';
import Landing from './pages/Landing';
import IntakeStep1 from './pages/intake/Step1';
import IntakeStep2 from './pages/intake/Step2';
import IntakeStep3 from './pages/intake/Step3';
import Matches from './pages/Matches';
import RealTimeMatches from './pages/RealTimeMatches';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import AdminUserDetail from './pages/AdminUserDetail';
import TrainerInbox from './pages/TrainerInbox';
import TrainerChat from './pages/TrainerChat';
import FeedbackButton from './components/FeedbackButton';

function App() {
  return (
    <IntakeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/intake/step1" element={<IntakeStep1 />} />
          <Route path="/intake/step2" element={<IntakeStep2 />} />
          <Route path="/intake/step3" element={<IntakeStep3 />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/realtime-matches" element={<RealTimeMatches />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:clientProfileId/:expertId" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/:profileId" element={<AdminUserDetail />} />
          <Route path="/trainer/:expertId" element={<TrainerInbox />} />
          <Route path="/trainer/:expertId/chat/:clientProfileId" element={<TrainerChat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FeedbackButton />
      </BrowserRouter>
    </IntakeProvider>
  );
}

export default App;
