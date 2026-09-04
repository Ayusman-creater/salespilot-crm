import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetMeQuery } from "./features/auth/authApi";
import { setCredentials, finishInitializing } from "./features/auth/authSlice";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import Deals from "./pages/Deals.jsx";
import DealDetail from "./pages/DealDetail.jsx";
import Activities from "./pages/Activities.jsx";
import Users from "./pages/Users.jsx";
import Notifications from "./pages/Notifications.jsx";

const withLayout = (Page) => (
  <Layout>
    <Page />
  </Layout>
);

function App() {
  const dispatch = useDispatch();
  const { data, isSuccess, isError, isLoading } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) return;
    if (isSuccess && data?.user) {
      dispatch(setCredentials(data.user));
    } else if (isError) {
      dispatch(finishInitializing());
    }
  }, [isLoading, isSuccess, isError, data, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute>{withLayout(Dashboard)}</ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute>{withLayout(Leads)}</ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute>{withLayout(LeadDetail)}</ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute>{withLayout(Customers)}</ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute>{withLayout(CustomerDetail)}</ProtectedRoute>} />
      <Route path="/deals" element={<ProtectedRoute>{withLayout(Deals)}</ProtectedRoute>} />
      <Route path="/deals/:id" element={<ProtectedRoute>{withLayout(DealDetail)}</ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute>{withLayout(Activities)}</ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute>{withLayout(Notifications)}</ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin"]}>{withLayout(Users)}</ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;