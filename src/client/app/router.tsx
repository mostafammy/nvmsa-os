import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell } from './layout/MobileShell';
import { OS_MODULES, type OsModuleDefinition } from './modules.registry';

function PlannedModulePlaceholder({ module }: { module: OsModuleDefinition }) {
  const Icon = module.icon;
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900">{module.name}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{module.description}</p>
      <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        Planned Module
      </span>
    </section>
  );
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
                  LazyComponent ? (
                    <Suspense
                      fallback={
                        <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
                          Loading {mod.name}...
                        </div>
                      }
                    >
                      <LazyComponent />
                    </Suspense>
                  ) : (
                    <PlannedModulePlaceholder module={mod} />
                  )
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
