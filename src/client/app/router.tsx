import { Component, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from '../core/auth/useSession';
import { MobileShell } from './layout/MobileShell';
import { OS_MODULES } from './modules.registry';

interface ModuleErrorBoundaryState {
  error: Error | null;
}

class ModuleErrorBoundary extends Component<
  { moduleName: string; children: ReactNode },
  ModuleErrorBoundaryState
> {
  state: ModuleErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xs">
          <h2 className="text-base font-bold text-slate-900">
            {this.props.moduleName} failed to render
          </h2>
          <p className="mt-1 text-xs text-slate-600">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 cursor-pointer rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Retry Module
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

function ModuleGuard({
  requiredCapability,
  children,
}: {
  requiredCapability?: keyof NonNullable<ReturnType<typeof useSession>['user']>['capabilities'];
  children: ReactNode;
}) {
  const { user, isLoading } = useSession();
  if (!requiredCapability) {
    return <>{children}</>;
  }
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
        Verifying seat authorization...
      </div>
    );
  }
  if (!user || !user.capabilities[requiredCapability]) {
    return <Navigate to="/calendar" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MobileShell />}>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          {OS_MODULES.map((mod) => {
            const LazyComponent = mod.component;
            return (
              <Route
                key={mod.id}
                path={mod.route}
                element={
                  <ModuleGuard requiredCapability={mod.requiredCapability}>
                    <ModuleErrorBoundary moduleName={mod.name}>
                      <Suspense
                        fallback={
                          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
                            Loading {mod.name}...
                          </div>
                        }
                      >
                        <LazyComponent />
                      </Suspense>
                    </ModuleErrorBoundary>
                  </ModuleGuard>
                }
              />
            );
          })}
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
