import { Component, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from '../core/auth/useSession';
import { Button } from '../ui/Button';
import { MobileShell } from './layout/MobileShell';
import { OS_MODULES } from './modules.registry';

interface ModuleErrorBoundaryState {
  error: Error | null;
}

function ModuleSkeleton({ label }: { label: string }) {
  return (
    <div className="panel space-y-4 p-5" aria-busy="true" aria-label={label}>
      <div className="flex items-center justify-between gap-3">
        <div className="skeleton h-8 w-44" />
        <div className="flex gap-2">
          <div className="skeleton h-11 w-11 rounded-full" />
          <div className="skeleton h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
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
        <section className="panel border-red-400/35 p-6 text-center">
          <h2 className="font-display text-[20px] font-medium text-ink">
            {this.props.moduleName} failed to render
          </h2>
          <p className="mt-1.5 text-[14px] text-muted">{this.state.error.message}</p>
          <Button
            size="sm"
            onClick={() => this.setState({ error: null })}
            className="mt-5"
          >
            Retry Module
          </Button>
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
    return <ModuleSkeleton label="Verifying seat authorization..." />;
  }
  if (!user || !user.capabilities[requiredCapability]) {
    return <Navigate to="/calendar" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter basename="/nvmsaOs">
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
                      <Suspense fallback={<ModuleSkeleton label={`Loading ${mod.name}...`} />}>
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
