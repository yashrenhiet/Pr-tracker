import type { ReactNode } from "react";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import styles from "./styles.module.css";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** One page heading layout for every page. Also owns the browser tab title, so no page can forget it. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useDocumentTitle(title);
  return (
    <div className={styles.header}>
      <div>
        <h1>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
