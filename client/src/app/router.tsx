import { type ReactNode, Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router';

import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect, RouteError } from '@/routes/UtilityPages';

const lazyViews = {
  ProfilePage: lazy(() =>
    import('@/pages/seeker/ProfilePage').then(({ ProfilePage }) => ({
      default: ProfilePage,
    })),
  ),
  CandidatePage: lazy(() =>
    import('@/pages/company/CandidatePage').then(({ CandidatePage }) => ({
      default: CandidatePage,
    })),
  ),
  CompanyLayout: lazy(() =>
    import('@/components/layout/CompanyLayout').then(({ CompanyLayout }) => ({
      default: CompanyLayout,
    })),
  ),
  SeekerLayout: lazy(() =>
    import('@/components/layout/SeekerLayout').then(({ SeekerLayout }) => ({
      default: SeekerLayout,
    })),
  ),
  LoginPage: lazy(() =>
    import('@/pages/auth/LoginPage').then(({ LoginPage }) => ({
      default: LoginPage,
    })),
  ),
  ApplicantsPage: lazy(() =>
    import('@/pages/company/ApplicantsPage').then(({ ApplicantsPage }) => ({
      default: ApplicantsPage,
    })),
  ),
  CompanyJobsPage: lazy(() =>
    import('@/pages/company/CompanyJobsPage').then(({ CompanyJobsPage }) => ({
      default: CompanyJobsPage,
    })),
  ),
  CreateJobPage: lazy(() =>
    import('@/pages/company/CreateJobPage').then(({ CreateJobPage }) => ({
      default: CreateJobPage,
    })),
  ),
  JobDetailPage: lazy(() =>
    import('@/pages/seeker/JobDetailPage').then(({ JobDetailPage }) => ({
      default: JobDetailPage,
    })),
  ),
  JobsPage: lazy(() =>
    import('@/pages/seeker/JobsPage').then(({ JobsPage }) => ({
      default: JobsPage,
    })),
  ),
  MyApplicationsPage: lazy(() =>
    import('@/pages/seeker/MyApplicationsPage').then(
      ({ MyApplicationsPage }) => ({
        default: MyApplicationsPage,
      }),
    ),
  ),
};

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <PageSkeleton />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect />, errorElement: <RouteError /> },
  {
    path: '/login',
    element: withSuspense(<lazyViews.LoginPage />),
    errorElement: <RouteError />,
  },
  {
    element: <ProtectedRoute roles={['JOB_SEEKER']} />,
    errorElement: <RouteError />,
    children: [
      {
        element: withSuspense(<lazyViews.SeekerLayout />),
        children: [
          {
            path: '/profile',
            element: withSuspense(<lazyViews.ProfilePage />),
          },
          {
            path: '/jobs',
            element: withSuspense(<lazyViews.JobsPage />),
          },
          {
            path: '/jobs/:jobId',
            element: withSuspense(<lazyViews.JobDetailPage />),
          },
          {
            path: '/applications',
            element: withSuspense(<lazyViews.MyApplicationsPage />),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['COMPANY']} />,
    errorElement: <RouteError />,
    children: [
      {
        element: withSuspense(<lazyViews.CompanyLayout />),
        children: [
          {
            path: '/company/applications/:applicationId',
            element: withSuspense(<lazyViews.CandidatePage />),
          },
          {
            path: '/company/jobs',
            element: withSuspense(<lazyViews.CompanyJobsPage />),
          },
          {
            path: '/company/jobs/new',
            element: withSuspense(<lazyViews.CreateJobPage />),
          },
          {
            path: '/company/jobs/:jobId/applicants',
            element: withSuspense(<lazyViews.ApplicantsPage />),
          },
        ],
      },
    ],
  },
  { path: '*', element: <HomeRedirect /> },
]);
