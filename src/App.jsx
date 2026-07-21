import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config';

// Pages
import Login from './pages/Login';
import Overview from './pages/Overview';
import CurrentTransactions from './pages/CurrentTransactions';
import TransactionHistory from './pages/TransactionHistory';
import OverdueTracker from './pages/OverdueTracker';
import NotificationHistory from './pages/NotificationHistory';
import StudentWelcome from './pages/StudentWelcome';

// Premium MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8', // Modern google blue
      light: '#e8f0fe',
      dark: '#0d6efd',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0', // Purple
      light: '#f3e5f5',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#e8f5e9',
    },
    error: {
      main: '#d32f2f',
      light: '#ffebee',
    },
    warning: {
      main: '#ed6c02',
      light: '#fff3e0',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Prompt',
      'Roboto',
      '-apple-system',
      'sans-serif'
    ].join(','),
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes (Module 1, 4, 5) */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Overview />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/current"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <CurrentTransactions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <TransactionHistory />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/overdue"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <OverdueTracker />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications-log"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <NotificationHistory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentWelcome />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
