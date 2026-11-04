import type { ReactNode } from 'react';
import './appShell.css';

type Props = {
  userDisplayName: string;
  onSignOut: () => void;
  children: ReactNode;
};

export function AppShell({ userDisplayName, onSignOut, children }: Props) {
  return (
    <div className="app-layout">
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-inner">
          <div className="topbar-leading">
            <a className="topbar-brand" href="./" aria-label="Web2Table Support Desk home">
              <img
                className="topbar-brand-logo"
                src="https://wvibrchebfwirbgkcnbr.supabase.co/storage/v1/object/public/web2table-assets/web2table.png"
                alt="Web2Table Support Desk"
              />
              <span className="topbar-brand-copy"><small>SUPPORT DESK</small></span>
            </a>
          </div>
          <div className="topbar-actions">
            <div className="live-label"><span className="live-dot" /> Live updates</div>
            <span className="topbar-user" title={userDisplayName}>{userDisplayName}</span>
            <button className="icon-button signout topbar-logout" onClick={onSignOut} aria-label="Log out" title="Log out">
              ↗
            </button>
          </div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
