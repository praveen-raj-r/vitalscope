/** The Vitalscope mark: a ring with a pulse line. Decorative; the name is always written next to it. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="9.5" fill="none" stroke="#0b0b0b" strokeWidth="1.5" />
      <path d="M4 12.5h3.5l2-5 3 8 2-4H18" fill="none" stroke="#2a78d6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Small outline icons for buttons and links. Decorative: the visible text always says what the control does. */
function Icon({ size = 16, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M6.6 5.6v4.8L10.6 8z" fill="currentColor" stroke="none" />
  </Icon>
);
export const IconSignIn = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M6 2.75H3.75a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1H6" />
    <path d="M6.5 8h7M10.75 5.25L13.5 8l-2.75 2.75" />
  </Icon>
);
export const IconBook = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M2.5 3.5A1.5 1.5 0 0 1 4 2h8.5v10.5H4A1.5 1.5 0 0 0 2.5 14z" />
    <path d="M2.5 14h10M5.5 5h4.5" />
  </Icon>
);
export const IconBox = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M8 1.75l5.5 3v6.5l-5.5 3-5.5-3v-6.5z" />
    <path d="M2.75 4.9L8 8l5.25-3.1M8 8v6" />
  </Icon>
);
export const IconBug = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75V8.5M8 10.75v.1" />
  </Icon>
);
export const IconScale = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M8 2.5v11M4.5 13.5h7M3 4.5h10" />
    <path d="M3 4.5L1.5 8.5a1.6 1.6 0 0 0 3 0zM13 4.5L11.5 8.5a1.6 1.6 0 0 0 3 0z" />
  </Icon>
);
export const IconArrowUp = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M8 13V3M3.75 7.25L8 3l4.25 4.25" />
  </Icon>
);
