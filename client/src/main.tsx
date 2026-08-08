import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Fines from './pages/Fines';
import Catalog from './pages/Catalog';
import BookDetail from './pages/BookDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Members from './pages/admin/Members';
import AdminBooks from './pages/admin/Books';
import AdminLoans from './pages/admin/Loans';
import AdminFines from './pages/admin/Fines';
import Branches from './pages/admin/Branches';
import Reservations from './pages/admin/Reservations';
import StaffPage from './pages/admin/Staff';
import AuditLog from './pages/admin/AuditLog';
import Reports from './pages/admin/Reports';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/books/:isbn" element={<BookDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
          <Route path="/fines" element={<ProtectedRoute><Fines /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/members" element={<AdminLayout><Members /></AdminLayout>} />
          <Route path="/admin/books" element={<AdminLayout><AdminBooks /></AdminLayout>} />
          <Route path="/admin/loans" element={<AdminLayout><AdminLoans /></AdminLayout>} />
          <Route path="/admin/fines" element={<AdminLayout><AdminFines /></AdminLayout>} />
          <Route path="/admin/branches" element={<AdminLayout><Branches /></AdminLayout>} />
          <Route path="/admin/reservations" element={<AdminLayout><Reservations /></AdminLayout>} />
          <Route path="/admin/staff" element={<AdminLayout><StaffPage /></AdminLayout>} />
          <Route path="/admin/audit-log" element={<AdminLayout><AuditLog /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
