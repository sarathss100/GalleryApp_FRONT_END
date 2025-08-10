import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'
import './App.css'
import Login from './pages/SignIn';
import Signup from './pages/Signup';
import Verification from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/ProtectedRoute';
import HomePage from './pages/Home';

const Layout = () => {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

const App = function () {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={
            <ErrorBoundary>
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            </ErrorBoundary>
          } />
        </Route >
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-cache/:email" element={<Verification />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:email" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
};

export default App;
