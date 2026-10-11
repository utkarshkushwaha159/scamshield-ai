import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { SubmitEvidencePage } from './pages/SubmitEvidencePage';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { CaseHistoryPage } from './pages/CaseHistoryPage';
import { AnalystDashboardPage } from './pages/AnalystDashboardPage';
import { CaseInvestigationPage } from './pages/CaseInvestigationPage';
import { EvidenceGraphView } from './pages/EvidenceGraphView';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <main className="content-wrapper">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/submit" element={<SubmitEvidencePage />} />
            <Route path="/analysis/:caseRef" element={<AnalysisResultPage />} />
            <Route path="/history" element={<CaseHistoryPage />} />
            <Route path="/analyst" element={<AnalystDashboardPage />} />
            <Route path="/investigate/:caseId" element={<CaseInvestigationPage />} />
            <Route path="/graph" element={<EvidenceGraphView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
