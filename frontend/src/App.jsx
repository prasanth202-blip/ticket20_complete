import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  AddCompanyProvider, EditCompanyProvider, FeatureOverrideProvider, PlanProvider,
  ServiceProvider, StaffProvider, TicketProvider
} from './components/shared';

// Platform
import LandingPage          from './pages/platform/LandingPage';
import PlatformDashboard    from './pages/platform/PlatformDashboard';
import PlatformCompanies    from './pages/platform/PlatformCompanies';
import PlatformCompanyAdd   from './pages/platform/PlatformCompanyAdd';
import PlatformTickets      from './pages/platform/PlatformTickets';
import PlatformAnalytics    from './pages/platform/PlatformAnalytics';
import PlatformPlans        from './pages/platform/PlatformPlans';
import PlatformSubscriptions from './pages/platform/PlatformSubscriptions';
import PlatformTransactions  from './pages/platform/PlatformTransactions';
import PlatformSettings     from './pages/platform/PlatformSettings';
import PlatformUsers        from './pages/platform/PlatformUsers';
import PlatformRevenue      from './pages/platform/PlatformRevenue';

// Auth
import PlatformLogin        from './pages/auth/PlatformLogin';
import { CompanyLogin }     from './pages/auth/PlatformLogin';
import { UserLogin }        from './pages/auth/PlatformLogin';
import { UserRegister }     from './pages/auth/PlatformLogin';
import CompanyRegister      from './pages/auth/CompanyRegister';
import ForgotPassword, { ResetPassword } from './pages/auth/ForgotPassword';

// Company
import CompanyDashboard     from './pages/company/CompanyDashboard';
import CompanyTickets       from './pages/company/CompanyTickets';
import CompanyStaff         from './pages/company/CompanyStaff';
import CompanyUsers         from './pages/company/CompanyUsers';
import CompanySettings      from './pages/company/CompanySettings';
import CompanyRatings       from './pages/company/CompanyRatings';
import CompanyAnalytics     from './pages/company/CompanyAnalytics';
import CompanyServices      from './pages/company/CompanyServices';
import CompanySubscription  from './pages/company/CompanySubscription';

// Tickets
import TicketDetail         from './pages/tickets/TicketDetail';
import CreateTicket         from './pages/tickets/CreateTicket';

// Agent
import AgentDashboard       from './pages/agent/AgentDashboard';
import AgentTickets         from './pages/agent/AgentTickets';
import AgentProfile         from './pages/agent/AgentProfile';

// User
import UserDashboard        from './pages/user/UserDashboard';
import UserTickets          from './pages/user/UserTickets';
import UserProfile          from './pages/user/UserProfile';
import UserServices         from './pages/user/UserServices';

// Profile
import ProfilePage          from './pages/shared/ProfilePage';

// Legal Pages
import TermsPage            from './pages/platform/TermsPage';
import PrivacyPage          from './pages/platform/PrivacyPage';

// Layouts
import PlatformLayout       from './components/layout/PlatformLayout';
import CompanyLayout        from './components/layout/CompanyLayout';
import AgentLayout          from './components/layout/AgentLayout';
import UserLayout           from './components/layout/UserLayout';

// ── Guards ────────────────────────────────────────────────
const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:9, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <span style={{ color:'var(--muted)', fontSize:13 }}>Loading…</span>
    </div>
  );
  if (!user) return <Navigate to="/" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace/>;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const slug = user.company?.slug || user.companySlug;
    if (user.role === 'platform_owner') return <Navigate to="/platform/dashboard" replace/>;
    if (['company_super_admin','company_admin','employee'].includes(user.role)) return <Navigate to={`/${slug}/dashboard`} replace/>;
    if (user.role === 'agent') return <Navigate to={`/${slug}/agent/dashboard`} replace/>;
    if (user.role === 'user')  return <Navigate to={`/${slug}/my/dashboard`} replace/>;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<RedirectIfAuth><LandingPage/></RedirectIfAuth>}/>
      <Route path="/pricing" element={<LandingPage section="pricing"/>}/>
      <Route path="/about"   element={<LandingPage section="about"/>}/>
      <Route path="/contact" element={<LandingPage section="contact"/>}/>
      <Route path="/terms"   element={<TermsPage/>}/>
      <Route path="/privacy" element={<PrivacyPage/>}/>
      <Route path="/register" element={<RedirectIfAuth><CompanyRegister/></RedirectIfAuth>}/>

      {/* Auth */}
      <Route path="/platform/login"          element={<RedirectIfAuth><PlatformLogin/></RedirectIfAuth>}/>
      <Route path="/platform/forgot-password" element={<ForgotPassword/>}/>
      <Route path="/platform/reset-password/:token" element={<ResetPassword/>}/>

      <Route path="/:companySlug/login"           element={<RedirectIfAuth><CompanyLogin/></RedirectIfAuth>}/>
      <Route path="/:companySlug/forgot-password" element={<ForgotPassword/>}/>
      <Route path="/:companySlug/reset-password/:token" element={<ResetPassword/>}/>

      <Route path="/:companySlug/user/login"          element={<RedirectIfAuth><UserLogin/></RedirectIfAuth>}/>
      <Route path="/:companySlug/user/register"       element={<RedirectIfAuth><UserRegister/></RedirectIfAuth>}/>
      <Route path="/:companySlug/user/forgot-password" element={<ForgotPassword/>}/>
      <Route path="/:companySlug/user/reset-password/:token" element={<ResetPassword/>}/>

      {/* Platform Owner */}
      <Route path="/platform" element={<RequireAuth roles={['platform_owner']}><PlatformLayout/></RequireAuth>}>
        <Route index            element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard" element={<PlatformDashboard/>}/>
        <Route path="companies" element={<PlatformCompanies/>}/>
        <Route path="companies/add" element={<PlatformCompanyAdd/>}/>
        <Route path="tickets"   element={<PlatformTickets/>}/>
        <Route path="analytics" element={<PlatformAnalytics/>}/>
        <Route path="plans"           element={<PlatformPlans/>}/>
        <Route path="subscriptions"   element={<PlatformSubscriptions/>}/>
        <Route path="transactions"    element={<PlatformTransactions/>}/>
        <Route path="settings"        element={<PlatformSettings/>}/>
        <Route path="users"           element={<PlatformUsers/>}/>
        <Route path="revenue"         element={<PlatformRevenue/>}/>
        <Route path="profile"   element={<ProfilePage/>}/>
      </Route>

      {/* Company Staff */}
      <Route path="/:companySlug" element={<RequireAuth roles={['company_super_admin','company_admin','employee']}><CompanyLayout/></RequireAuth>}>
        <Route index              element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard"   element={<CompanyDashboard/>}/>
        <Route path="tickets"     element={<CompanyTickets/>}/>
        <Route path="tickets/new" element={<CreateTicket/>}/>
        <Route path="tickets/:id" element={<TicketDetail/>}/>
        <Route path="staff"       element={<CompanyStaff/>}/>
        <Route path="users"       element={<CompanyUsers/>}/>
        <Route path="ratings"     element={<CompanyRatings/>}/>
        <Route path="analytics"   element={<CompanyAnalytics/>}/>
        <Route path="services"    element={<CompanyServices/>}/>
        <Route path="subscription" element={<CompanySubscription/>}/>
        <Route path="settings"    element={<CompanySettings/>}/>
        <Route path="profile"     element={<ProfilePage/>}/>
      </Route>

      {/* Agent */}
      <Route path="/:companySlug/agent" element={<RequireAuth roles={['agent']}><AgentLayout/></RequireAuth>}>
        <Route index              element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard"   element={<AgentDashboard/>}/>
        <Route path="tickets"     element={<AgentTickets/>}/>
        <Route path="tickets/:id" element={<TicketDetail/>}/>
        <Route path="profile"     element={<ProfilePage/>}/>
      </Route>

      {/* Customer */}
      <Route path="/:companySlug/my" element={<RequireAuth roles={['user']}><UserLayout/></RequireAuth>}>
        <Route index              element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard"   element={<UserDashboard/>}/>
        <Route path="tickets"     element={<UserTickets/>}/>
        <Route path="tickets/new" element={<CreateTicket/>}/>
        <Route path="tickets/:id" element={<TicketDetail/>}/>
        <Route path="services"    element={<UserServices/>}/>
        <Route path="profile"     element={<UserProfile/>}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AddCompanyProvider>
        <EditCompanyProvider>
          <FeatureOverrideProvider>
            <PlanProvider>
              <ServiceProvider>
                <StaffProvider>
                  <TicketProvider>
                    <AuthProvider>
                      <AppRoutes/>
                      <Toaster
                        position="top-right"
                        gutter={8}
                        toastOptions={{
                          duration: 3500,
                          style: {
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            fontFamily: 'var(--font-b)',
                            fontSize: 13.5,
                            boxShadow: 'var(--shadow)',
                            borderRadius: 10,
                          },
                          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                      />
                    </AuthProvider>
                  </TicketProvider>
                </StaffProvider>
              </ServiceProvider>
            </PlanProvider>
          </FeatureOverrideProvider>
        </EditCompanyProvider>
      </AddCompanyProvider>
    </BrowserRouter>
  );
}
