import React, { createContext, useContext, useEffect, useState } from 'react';
import { Token, androidName, cssName, figmaName, iosName } from './tokens';

export type Platform = 'ios' | 'android' | 'css' | 'figma';
const LABEL: Record<Platform, string> = { ios: 'iOS (Swift)', android: 'Android (XML)', css: 'Web (CSS)', figma: 'Figma' };
const KEY = 'currency-docs-platform';

const read = (): Platform => {
  try { return (localStorage.getItem(KEY) as Platform) || 'ios'; } catch { return 'ios'; }
};

// One shared choice across every table on every page (remembered per browser).
const listeners = new Set<(p: Platform) => void>();
let current: Platform = read();
function setPlatform(p: Platform) {
  current = p;
  try { localStorage.setItem(KEY, p); } catch { /* private mode: keep in memory */ }
  listeners.forEach((l) => l(p));
}
export function usePlatform(): [Platform, (p: Platform) => void] {
  const [p, set] = useState(current);
  useEffect(() => { listeners.add(set); return () => { listeners.delete(set); }; }, []);
  return [p, setPlatform];
}

export function nameFor(t: Token, p: Platform) {
  if (p === 'ios') return iosName(t.path);
  if (p === 'android') return androidName(t);
  if (p === 'css') return `var(${cssName(t.path)})`;
  return figmaName(t.path);
}

export function PlatformSwitch() {
  const [p, set] = usePlatform();
  return (
    <div className="cx-switch" role="tablist" aria-label="Show token names for">
      <span className="cx-switch-label">Show names for</span>
      {(Object.keys(LABEL) as Platform[]).map((k) => (
        <button key={k} role="tab" aria-selected={p === k} className={p === k ? 'on' : ''} onClick={() => set(k)}>
          {LABEL[k]}
        </button>
      ))}
    </div>
  );
}

export function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="cx-code"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); });
      }}
    >
      {text}
      <span className="cx-copied" aria-live="polite">{done ? 'Copied' : ''}</span>
    </button>
  );
}

export function TokenName({ t }: { t: Token }) {
  const [p] = usePlatform();
  return <Copy text={nameFor(t, p)} />;
}

export const Section = ({ title, children, intro }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) => (
  <section className="cx-section">
    <h3>{title}</h3>
    {intro && <p className="cx-muted">{intro}</p>}
    {children}
  </section>
);
