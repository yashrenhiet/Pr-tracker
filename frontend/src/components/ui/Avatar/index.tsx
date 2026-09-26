import styles from "./styles.module.css";

const TONE_COUNT = 6;

function initials(name: string): string {
  const parts = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/** Same name, same colour, every time and on every page — so people become recognisable. */
function toneFor(name: string): string {
  let hash = 0;
  for (const char of name.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return styles[`tone${Math.abs(hash) % TONE_COUNT}`];
}

export interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  /** Tooltip text; defaults to the name. */
  title?: string;
}

/** Decorative initials badge. Always pair with the name in text (visible or visually-hidden). */
export function Avatar({ name, size = "sm", title }: AvatarProps) {
  return (
    <span className={[styles.avatar, styles[size], toneFor(name)].join(" ")} title={title ?? name} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export interface AvatarStackPerson {
  name: string;
  title?: string;
}

export function AvatarStack({ people, max = 3 }: { people: AvatarStackPerson[]; max?: number }) {
  const shown = people.slice(0, max);
  const hidden = people.length - shown.length;
  return (
    <span className={styles.stack}>
      {shown.map((p) => (
        <Avatar key={`${p.name}-${p.title}`} name={p.name} title={p.title} />
      ))}
      {hidden > 0 && (
        <span
          className={[styles.avatar, styles.sm, styles.overflow].join(" ")}
          title={people.slice(max).map((p) => p.title ?? p.name).join(", ")}
          aria-hidden="true"
        >
          +{hidden}
        </span>
      )}
    </span>
  );
}
