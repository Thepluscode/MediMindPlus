import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const HomePage = lazy(() => import('../pages/home/page'));
const VirtualHealthTwinPage = lazy(() => import('../pages/virtual-health-twin/page'));
const BiologicalAgePage = lazy(() => import('../pages/biological-age/page'));
const DrugInteractionPage = lazy(() => import('../pages/drug-interaction/page'));
const CBTChatbotPage = lazy(() => import('../pages/cbt-chatbot/page'));
const ProfilePage = lazy(() => import('../pages/profile/page'));
const EditProfilePage = lazy(() => import('../pages/edit-profile/page'));
const SettingsPage = lazy(() => import('../pages/settings/page'));
const HelpCenterPage = lazy(() => import('../pages/help-center/page'));
const PricingPage = lazy(() => import('../pages/pricing/page'));
const ResourcesPage = lazy(() => import('../pages/resources/page'));
const EnterprisePage = lazy(() => import('../pages/enterprise/page'));
const ProvidersPage = lazy(() => import('../pages/providers/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const BookAppointmentPage = lazy(() => import('../pages/book-appointment/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const DeviceIntegrationPage = lazy(() => import('../pages/device-integration/page'));
const HealthAnalyticsPage = lazy(() => import('../pages/health-analytics/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const TeamManagementPage = lazy(() => import('../pages/team-management/page'));
const AuditLogsPage = lazy(() => import('../pages/audit-logs/page'));
const RolesPermissionsPage = lazy(() => import('../pages/roles-permissions/page'));
const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const VideoRoomPage = lazy(() => import('../pages/consultation/VideoRoom'));
const ProviderSearchPage = lazy(() => import('../pages/patient/ProviderSearch'));

// Radiologist Portal Pages
const RadiologistWorklist = lazy(() => import('../pages/radiologist/Worklist'));
const RadiologistViewer = lazy(() => import('../pages/radiologist/Viewer'));
const RadiologistFeedback = lazy(() => import('../pages/radiologist/Feedback'));
const RadiologistDashboard = lazy(() => import('../pages/radiologist/Dashboard'));

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/consultation/:consultationId/room',
    element: <VideoRoomPage />,
  },
  {
    path: '/find-doctor',
    element: <ProviderSearchPage />,
  },
  // Radiologist Portal Routes
  {
    path: '/radiologist/worklist',
    element: <RadiologistWorklist />,
  },
  {
    path: '/radiologist/viewer/:studyId',
    element: <RadiologistViewer />,
  },
  {
    path: '/radiologist/feedback/:studyId',
    element: <RadiologistFeedback />,
  },
  {
    path: '/radiologist/dashboard',
    element: <RadiologistDashboard />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/virtual-health-twin',
    element: <VirtualHealthTwinPage />,
  },
  {
    path: '/biological-age',
    element: <BiologicalAgePage />,
  },
  {
    path: '/drug-interaction',
    element: <DrugInteractionPage />,
  },
  {
    path: '/cbt-chatbot',
    element: <CBTChatbotPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/edit-profile',
    element: <EditProfilePage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/help-center',
    element: <HelpCenterPage />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    path: '/resources',
    element: <ResourcesPage />,
  },
  {
    path: '/enterprise',
    element: <EnterprisePage />,
  },
  {
    path: '/providers',
    element: <ProvidersPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/book-appointment',
    element: <BookAppointmentPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/device-integration',
    element: <DeviceIntegrationPage />,
  },
  {
    path: '/health-analytics',
    element: <HealthAnalyticsPage />,
  },
  {
    path: '/team-management',
    element: <TeamManagementPage />,
  },
  {
    path: '/audit-logs',
    element: <AuditLogsPage />,
  },
  {
    path: '/roles-permissions',
    element: <RolesPermissionsPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
