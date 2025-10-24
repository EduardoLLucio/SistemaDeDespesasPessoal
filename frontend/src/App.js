import './App.scss';
import Dashboard from './Componentes/Dashboard/Dashboard';
import Login from './Componentes/Login/Login';
import Register from './Componentes/Register/Register';
import ForgotPassword from './Componentes/ForgotPassword/ForgotPassword'
import ResetPassword from './Componentes/ResetPassword/ResetPassword';



import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  
  {
    path: '/dashboard',
    element: <Dashboard />
  },

  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },

  {
    path: '/reset-password',
    element: <ResetPassword />
  },

])



function App() {
  return (
    
     <div>
      <RouterProvider router={router} />
     </div>
  )
}

export default App;
