import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import CurriculumPage from './pages/CurriculumPage.jsx';
import ProceduresPage from './pages/ProceduresPage.jsx';
import GradesPage from './pages/GradesPage.jsx';
import EnrollmentPage from './pages/EnrollmentPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/home', element: <HomePage /> },
      { path: '/curriculum', element: <CurriculumPage /> },
      { path: '/procedures', element: <ProceduresPage /> },
      { path: '/grades', element: <GradesPage /> },
      { path: '/enrollment', element: <EnrollmentPage /> },
      { path: '/resources', element: <ResourcesPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
