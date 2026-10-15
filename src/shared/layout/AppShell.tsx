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
          <div className="topbar-leading">
            <a className="topbar-brand" href="./" aria-label="Web2Table Support Desk home">
              <img
                className="topbar-brand-logo"
                src="https://xaihajwrsvcdjisezmmc.supabase.co/storage/v1/object/public/web2table-assets/web2table1.png"
                alt="Web2Table Support Desk"
              />
            </a>
          </div>
          <div className="topbar-actions">
            <div className="live-label"><span className="live-dot" /> Live updates</div>
            <span className="topbar-user" title={userEmail}>{userEmail}</span>
            <button className="icon-button signout topbar-logout" onClick={onSignOut} aria-label="Log out" title="Log out">
              ↗
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
