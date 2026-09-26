import { useEffect } from "react";

const APP_NAME = "PR Tracker";

/** Per-page browser tab titles, so a customer with five tabs open can tell them apart. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
