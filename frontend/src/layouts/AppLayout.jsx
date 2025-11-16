import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getStoredLogin } from '../api/api';

const primaryNav = [
  { path: '/home', label: 'Home', icon: 'home' },
  { path: '/curriculum', label: 'Curriculum', icon: 'auto_stories' },
  { path: '/procedures', label: 'Procedures', icon: 'description' },
  { path: '/grades', label: 'My Grades', icon: 'monitoring' },
  { path: '/enrollment', label: 'Matrícula IA', icon: 'app_registration' },
  { path: '/resources', label: 'Academic Resources', icon: 'library_books' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const storedLogin = getStoredLogin();
  const alumnoInfo = storedLogin?.alumno_info ?? {};
  const fullName = [alumnoInfo.nombre, alumnoInfo.apellido]
    .filter(Boolean)
    .join(' ') || 'Estudiante UTEC';
  const carrera = alumnoInfo.carrera || 'Carrera no registrada';

  return (
    <div className="flex h-screen text-utec-text">
      <aside
        className={clsx(
          'flex-shrink-0 border-r border-utec-border bg-utec-surface py-8 transition-all duration-300',
          sidebarCollapsed ? 'w-20 px-3' : 'w-72 px-6'
        )}
      >
        <div className="flex h-full flex-col gap-8">
          <div>
            <div
              className={clsx(
                'flex items-center gap-3 pb-6',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="rounded-full border border-utec-border p-1 transition hover:border-utec-blue focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
                aria-label="Ir a inicio"
              >
                <img
                  src="/logo-utec.png"
                  alt="UTEC logo"
                  className="h-12 w-12 rounded-full object-contain"
                />
              </button>
              {!sidebarCollapsed && (
                <div>
                  <p className="text-base font-semibold">{fullName}</p>
                  <p className="text-sm text-utec-muted">{carrera}</p>
                </div>
              )}
            </div>
            <nav className="flex flex-col gap-1">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      sidebarCollapsed && 'justify-center',
                      isActive
                        ? 'bg-utec-blue/10 text-utec-blue'
                        : 'text-utec-muted hover:bg-gray-100'
                    )
                  }
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="mt-auto flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100',
                sidebarCollapsed ? 'justify-center text-utec-blue' : 'text-utec-blue'
              )}
            >
              <span className="material-symbols-outlined text-xl">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
              {!sidebarCollapsed && <span>{sidebarCollapsed ? 'Expandir' : 'Contraer'} menu</span>}
            </button>
            <button
              type="button"
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-utec-muted transition-colors hover:bg-gray-100',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-utec-muted transition-colors hover:bg-gray-100',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              {!sidebarCollapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
