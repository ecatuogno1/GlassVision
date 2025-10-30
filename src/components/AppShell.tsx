import type { ReactNode } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface AppShellProps {
  title: string;
  description: string;
  navItems: NavigationItem[];
  activeNav: string;
  onNavigate: (id: string) => void;
  userEmail: string;
  onSignOut: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
}

const AppShell = ({
  title,
  description,
  navItems,
  activeNav,
  onNavigate,
  userEmail,
  onSignOut,
  children,
  headerActions
}: AppShellProps) => {
  return (
    <div className="cms-shell">
      <aside className="cms-sidebar" aria-label="Main navigation">
        <div className="cms-brand">
          <span aria-hidden="true">🧊</span>
          <div>
            <h1>GlassVision</h1>
            <p>Experience CMS</p>
          </div>
        </div>
        <nav className="cms-nav">
          {navItems.map((item) => {
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                type="button"
                className={isActive ? 'cms-nav-item active' : 'cms-nav-item'}
                onClick={() => onNavigate(item.id)}
              >
                <span className="cms-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="cms-nav-label">{item.label}</span>
                {typeof item.badge === 'number' && (
                  <span className="cms-nav-badge" aria-label={`${item.badge} items`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="cms-sidebar-footer">
          <div className="cms-sidebar-user">
            <span className="cms-sidebar-user-label">Logged in</span>
            <span className="cms-sidebar-user-email">{userEmail}</span>
          </div>
          <button type="button" className="cms-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="cms-main">
        <header className="cms-topbar">
          <div className="cms-topbar-titles">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="cms-topbar-actions">{headerActions}</div>
        </header>
        <div className="cms-content">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
