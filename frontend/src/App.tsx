import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
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
      <AuthProvider>
        <div className="app-container">
          <Header />
          <main className="content-wrapper">
            <Routes>
              {/* Public Citizen Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/submit" element={<SubmitEvidencePage />} />
              <Route path="/analysis/:caseRef" element={<AnalysisResultPage />} />
              <Route path="/history" element={<CaseHistoryPage />} />
              <Route path="/graph" element={<EvidenceGraphView />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Analyst & Admin Routes */}
              <Route
                path="/analyst"
                element={
                  <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                    <AnalystDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investigate/:caseId"
                element={
                  <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                    <CaseInvestigationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
