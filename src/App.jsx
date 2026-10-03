import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CropProvider } from './context/CropContext';
import { NetworkProvider } from './context/NetworkContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MycropsPage from './pages/MycropsPage';
import AddCropPage from './pages/AddCropPage';
import CropDetailPage from './pages/CropDetailPage';
import SmartIrrigationPage from './pages/SmartIrrigationPage';
import WeatherPage from './pages/WeatherPage';
import CropAdvisorPage from './pages/CropAdvisorPage';
import MarketDemandPage from './pages/MarketDemandPage';
import ProfitCalculatorPage from './pages/ProfitCalculatorPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <CropProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/crops"
              element={<ProtectedRoute><MycropsPage /></ProtectedRoute>}
            />
            <Route
              path="/crops/add"
              element={<ProtectedRoute><AddCropPage /></ProtectedRoute>}
            />
            <Route
              path="/crops/:id"
              element={<ProtectedRoute><CropDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/crops/:id/edit"
              element={<ProtectedRoute><AddCropPage /></ProtectedRoute>}
            />
            <Route
              path="/irrigation"
              element={<ProtectedRoute><SmartIrrigationPage /></ProtectedRoute>}
            />
            <Route
              path="/weather"
              element={<ProtectedRoute><WeatherPage /></ProtectedRoute>}
            />
            <Route
              path="/advisor"
              element={<ProtectedRoute><CropAdvisorPage /></ProtectedRoute>}
            />
            <Route
              path="/market"
              element={<ProtectedRoute><MarketDemandPage /></ProtectedRoute>}
            />
            <Route
              path="/calculator"
              element={<ProtectedRoute><ProfitCalculatorPage /></ProtectedRoute>}
            />
            <Route
              path="/notifications"
              element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CropProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}

export default App;
