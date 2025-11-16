import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IntakeProvider } from './context/IntakeContext';
import { startKeepAlive } from './lib/keepAlive';
import Landing from './pages/Landing';
import IntakeStep1 from './pages/intake/Step1';
import IntakeStep2 from './pages/intake/Step2';
import IntakeStep3 from './pages/intake/Step3';
import Matches from './pages/Matches';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

function App() {
  useEffect(() => {
    startKeepAlive();
  }, []);

  return (
    <IntakeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/intake/step1" element={<IntakeStep1 />} />
          <Route path="/intake/step2" element={<IntakeStep2 />} />
          <Route path="/intake/step3" element={<IntakeStep3 />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:clientProfileId/:expertId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </IntakeProvider>
  );
}

export default App;
