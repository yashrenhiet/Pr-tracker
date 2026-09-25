import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { GitPullRequest } from "lucide-react";
import styles from "./styles.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Reviews", end: true },
  { to: "/reviewers", label: "Reviewers" },
];

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          <GitPullRequest size={20} aria-hidden="true" />
          PR Tracker
        </a>
        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => [styles.link, isActive && styles.linkActive].filter(Boolean).join(" ")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={styles.main}>{children ?? <Outlet />}</main>
    </div>
  );
}
