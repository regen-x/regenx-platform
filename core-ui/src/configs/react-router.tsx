import {
	Navigate,
	Outlet,
	RouteObject,
	createBrowserRouter,
} from 'react-router-dom';

import RequireDeveloperSetup from '@/components/auth/RequireDeveloperSetup';
import { AUTH_PREFIX, PATHS } from '@/constants/routes/paths';
import AuthLayout from '@/layout/Auth';
import PublicLayout from '@/layout/Public';
import AccountVerification from '@/pages/account-verification/AccountVerification';
import AdminAuditLog from '@/pages/admin-audit-log';
import AdminDashboard from '@/pages/admin-dashboard';
import AdminEntitiesSpvs from '@/pages/admin-entities-spvs';
import EntityDetail from '@/pages/admin-entities-spvs/EntityDetail';
import SpvDetail from '@/pages/admin-entities-spvs/SpvDetail';
import AdminInvestorApprovals from '@/pages/admin-investor-approvals';
import AdminProjectApprovalDetail from '@/pages/admin-project-approval-detail';
import AdminProjectApprovals from '@/pages/admin-project-approvals';
import AdminSupport from '@/pages/admin-support/AdminSupport';
import AdminTransactions from '@/pages/admin-transactions';
import ConfirmPassword from '@/pages/auth/ConfirmPassword';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResendConfirmationCode from '@/pages/auth/ResendConfirmationCode';
import SignIn from '@/pages/auth/SignIn';
import SignOut from '@/pages/auth/SignOut';
import SignUp from '@/pages/auth/SignUp';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import CashAccount from '@/pages/cash-account/CashAccount';
import Dashboard from '@/pages/dashboard/Dashboard';
import DevTransactions from '@/pages/dev-transactions/DevTransactions';
import DeveloperSettings from '@/pages/developer-settings/DeveloperSettings';
import DeveloperSetup from '@/pages/developer-setup/DeveloperSetup';
import Distributions from '@/pages/distributions/Distributions';
import Notifications from '@/pages/notifications/Notifications';
import Offers from '@/pages/offers/Offers';
import Opportunities from '@/pages/opportunities/Opportunities';
import OpportunityDetail from '@/pages/opportunities/OpportunityDetail';
import Orders from '@/pages/orders/Orders';
import Portfolio from '@/pages/portfolio';
import ProjectInvestors from '@/pages/project-investors/ProjectInvestors';
import ProjectSetup from '@/pages/project-setup/ProjectSetup';
import Project from '@/pages/project/Project';
import Projects from '@/pages/projects/Projects';
import Support from '@/pages/support/Support';
import Transactions from '@/pages/transactions/Transactions';

import Root from '@pages/Root';
import Home from '@pages/home/Home';

const authentication: RouteObject[] = [
	{
		path: AUTH_PREFIX,
		element: <Outlet />,
		children: [
			{ path: PATHS.SIGN_IN, element: <SignIn /> },
			{ path: PATHS.SIGN_UP, element: <SignUp /> },
			{ path: '/authverify-email', element: <VerifyEmail /> },
			{ path: PATHS.VERIFY_EMAIL, element: <VerifyEmail /> },
			{ path: PATHS.CONFIRM_PASSWORD, element: <ConfirmPassword /> },
			{
				path: PATHS.RESEND_CONFIRMATION_CODE,
				element: <ResendConfirmationCode />,
			},
			{ path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
			{ path: PATHS.SIGN_OUT, element: <SignOut /> },
		],
	},
];

const router = createBrowserRouter([
	{
		path: PATHS.ROOT,
		element: <Root />,
		children: [
			{
				path: PATHS.ROOT,
				element: <PublicLayout />,
				children: [{ index: true, element: <Home /> }, ...authentication],
			},
			{
				path: PATHS.ROOT,
				element: <AuthLayout />,
				children: [
					{ path: PATHS.DASHBOARD, element: <Dashboard /> },
					{ path: PATHS.DEVELOPER_SETUP, element: <DeveloperSetup /> },
					{ path: PATHS.SETTINGS, element: <DeveloperSettings /> },
					{
						element: <RequireDeveloperSetup />,
						children: [
							{
								path: PATHS.PROJECT_SETUP,
								element: <ProjectSetup />,
							},
						],
					},
					{ path: PATHS.PROJECTS, element: <Projects /> },
					{ path: PATHS.OPPORTUNITIES, element: <Opportunities /> },
					{ path: '/opportunities/:id', element: <OpportunityDetail /> },
					{ path: PATHS.CASH_ACCOUNT, element: <CashAccount /> },
					{ path: PATHS.TRANSACTIONS, element: <Transactions /> },
					{ path: PATHS.ORDERS, element: <Orders /> },
					{ path: PATHS.DISTRIBUTIONS, element: <Distributions /> },
					{ path: PATHS.NOTIFICATIONS, element: <Notifications /> },
					{ path: PATHS.SUPPORT, element: <Support /> },
					{ path: PATHS.DEV_TRANSACTIONS, element: <DevTransactions /> },
					{ path: PATHS.PROJECT_INVESTORS, element: <ProjectInvestors /> },
					{ path: PATHS.OFFERS, element: <Offers /> },
					{ path: '/portfolio', element: <Portfolio /> },
					{ path: '/project/:id', element: <Project /> },
					{
						path: PATHS.ACCOUNT_VERIFICATION,
						element: <AccountVerification />,
					},
					{
						path: '/admin',
						element: <Navigate to="/admin/dashboard" replace />,
					},
					{ path: '/admin/dashboard', element: <AdminDashboard /> },
					{
						path: '/admin/project-approvals',
						element: <AdminProjectApprovals />,
					},
					{
						path: '/admin/project-approvals/:id',
						element: <AdminProjectApprovalDetail />,
					},
					{
						path: '/admin/custody',
						element: <Navigate to="/admin/entities-spvs" replace />,
					},
					{ path: '/admin/entities-spvs', element: <AdminEntitiesSpvs /> },
					{
						path: '/admin/entities-spvs/entities/:id',
						element: <EntityDetail />,
					},
					{
						path: '/admin/entities-spvs/spvs/:id',
						element: <SpvDetail />,
					},
					{
						path: '/admin/investor-approvals',
						element: <AdminInvestorApprovals />,
					},
					{ path: '/admin/transactions', element: <AdminTransactions /> },
					{ path: '/admin/support', element: <AdminSupport /> },
					{ path: '/admin/audit-log', element: <AdminAuditLog /> },
				],
			},
		],
	},
]);

export default router;
