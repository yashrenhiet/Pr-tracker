import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Open modals, innermost last. A confirm dialog opened from inside a drawer must own Escape and Tab
 * on its own: both listen on `document`, so `stopPropagation` can't stop the drawer from also
 * closing. Only the top of this stack reacts to keys.
 */
const modalStack: object[] = [];

/**
 * Everything a modal surface owes keyboard and screen-reader users (WCAG 2.4.3 / 2.1.2):
 * focus moves in on open, Tab/Shift+Tab wrap inside instead of escaping to the page behind,
 * Escape closes, the page behind stops scrolling, and focus returns to the trigger on close.
 * Shared by Drawer and ConfirmDialog so the two can't drift apart.
 */
export function useModalBehavior(panelRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  // Callers pass inline arrows. Reading the latest one through a ref keeps the effect mount-only;
  // otherwise every parent re-render (e.g. a background refetch) would re-run it, yanking focus back
  // to the trigger and reordering the modal stack.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const token = {};
    modalStack.push(token);
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Order matters: record the trigger above *before* moving focus. React's `autoFocus` runs before
    // effects, so it would make us restore focus to an element that's about to unmount — hence a
    // `data-autofocus` marker the hook applies itself.
    const initial = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panelRef.current;
    initial?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (modalStack[modalStack.length - 1] !== token) {
        return;
      }
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      modalStack.splice(modalStack.indexOf(token), 1);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [panelRef]);
}
