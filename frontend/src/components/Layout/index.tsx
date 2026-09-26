import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { GitPullRequest, Users } from "lucide-react";
import { ErrorBoundary } from "../ui";
import styles from "./styles.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Pull requests", icon: GitPullRequest, end: true },
  { to: "/reviewers", label: "Reviewers", icon: Users },
];

export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <GitPullRequest size={16} />
            </span>
            PR Tracker
          </Link>
          <nav className={styles.nav} aria-label="Main">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => [styles.link, isActive && styles.linkActive].filter(Boolean).join(" ")}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {/* Keyed by route so one page crashing doesn't leave the error screen stuck on the next. */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className={styles.footer}>PR Tracker</footer>
    </div>
  );
}
