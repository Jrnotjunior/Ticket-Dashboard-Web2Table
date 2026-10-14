import type { ReactNode } from 'react';
import './appShell.css';

type Props = {
  userEmail: string;
  onSignOut: () => void;
  children: ReactNode;
};

export function AppShell({ userEmail, onSignOut, children }: Props) {
  return (
    <div className="app-layout">
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-muted">Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>Support tickets</strong>
          </div>
          <div className="topbar-actions">
            <div className="live-label"><span className="live-dot" /> Live updates</div>
            <span className="topbar-user" title={userEmail}>{userEmail}</span>
            <button className="button button-secondary topbar-logout" onClick={onSignOut}>
              <span aria-hidden="true">↗</span> Log out
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
