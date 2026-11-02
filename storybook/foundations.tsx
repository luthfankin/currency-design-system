import React from 'react';
import { Token, aliasOf, contrast, contrastReport, cssVar, get, hex, resolve, under } from './tokens';
import { Copy, PlatformSwitch, Section, TokenName, usePlatform, nameFor } from './ui';

const Wrap = ({ children }: { children: React.ReactNode }) => <div className="sb-unstyled cx">{children}</div>;
const last = (t: Token) => t.path[t.path.length - 1];

/* ------------------------------------------------------------------ Color */

const BRAND_HUES = ['red', 'blue', 'cyan', 'turquoise', 'green', 'orange', 'lime', 'neutral'];
const STATUS_HUES = ['success', 'warning', 'error', 'info'];
const ANCHOR: Record<string, string> = { red: '500', success: '500', warning: '400', error: '600', info: '600' };

function Ramp({ hue }: { hue: string }) {
  const steps = under(`color.${hue}`);
  return (
    <div className="cx-ramp">
      <div className="cx-ramp-name">{hue}</div>
      <div className="cx-ramp-steps">
        {steps.map((t) => {
          const h = hex(t);
          const onWhite = contrast(h, '#FFFFFF');
          return (
            <div key={t.path.join('.')} className="cx-step">
              <div className="cx-step-chip" style={{ background: cssVar(t.path) }}>
                {onWhite >= 4.5 && <span title="White text passes AA (4.5:1)">Aa</span>}
              </div>
              <div className="cx-step-label">
                {last(t)}
                {ANCHOR[hue] === last(t) && <span title="Source swatch"> ★</span>}
              </div>
              <div className="cx-step-hex">{h}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ColorPrimitives() {
  return (
    <Wrap>
      <Section title="Brand & extended palette" intro={<>Exact values from Figma <em>New Color — DOKU by Antom</em>. Figma <code>Red/50</code> = token <code>red/500</code>. <strong>Aa</strong> marks steps where white text passes WCAG AA.</>}>
        {BRAND_HUES.map((h) => <Ramp key={h} hue={h} />)}
      </Section>
      <Section title="Status palettes" intro={<>Generated around the source swatches (★), which stay exact.</>}>
        {STATUS_HUES.map((h) => <Ramp key={h} hue={h} />)}
      </Section>
    </Wrap>
  );
}

const GROUP_INTRO: Record<string, string> = {
  bg: 'Fills for screens, surfaces and controls.',
  text: 'Text colors. Every pair shown on the Contrast table passes AA.',
  icon: 'Icons and small glyphs (3:1 minimum against their background).',
  border: 'Strokes, dividers and focus rings.',
  accent: 'Category colors for badges, illustrations and charts. Pair each bg with its fg.',
};

export function SemanticColors({ group }: { group: keyof typeof GROUP_INTRO }) {
  const [p] = usePlatform();
  const rows = under(`color.${group}`);
  return (
    <Wrap>
      <Section title={`color/${group}`} intro={GROUP_INTRO[group]}>
        <table className="cx-table">
          <thead><tr><th style={{ width: 56 }} /><th>Token · {{ ios: 'iOS', android: 'Android', css: 'Web', figma: 'Figma variable' }[p]}</th><th>Points to</th><th>Value</th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const value = String(resolve(t));
              return (
                <tr key={t.path.join('.')}>
                  <td><div className="cx-swatch" style={{ background: cssVar(t.path) }} /></td>
                  <td><div className="cx-name">{t.path.slice(1).join('/')}</div><TokenName t={t} /></td>
                  <td className="cx-muted">{aliasOf(t)?.replace(/\./g, '/').replace('color/', '')}</td>
                  <td className="cx-mono">{value.length > 7 ? `${value.slice(0, 7).toUpperCase()} · ${Math.round(parseInt(value.slice(7), 16) / 2.55)}%` : value.toUpperCase()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </Wrap>
  );
}

export function ContrastTable() {
  return (
    <Wrap>
      <table className="cx-table">
        <thead><tr><th>Preview</th><th>Foreground</th><th>Background</th><th>Ratio</th><th>Needs</th></tr></thead>
        <tbody>
          {(contrastReport as { fg: string; bg: string; ratio: number; min: number; pass: boolean }[]).map((r) => (
            <tr key={r.fg + r.bg}>
              <td>
                <span className="cx-pair" style={{ background: cssVar(['color', ...r.bg.split('/')]), color: cssVar(['color', ...r.fg.split('/')]), borderColor: 'var(--color-border-subtle)' }}>
                  {r.fg.startsWith('border') ? '▢' : 'Aa'}
                </span>
              </td>
              <td className="cx-mono">{r.fg}</td>
              <td className="cx-mono">{r.bg}</td>
              <td><strong>{r.ratio.toFixed(2)}:1</strong></td>
              <td><span className={r.pass ? 'cx-pass' : 'cx-fail'}>{r.pass ? 'Pass' : 'Fail'}</span> <span className="cx-muted">≥ {r.min}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Wrap>
  );
}

/* ------------------------------------------------------------- Typography */

type TypeValue = { fontFamily: string; fontWeight: string; fontSize: string; lineHeight: string; letterSpacing: string };
const PROPS: (keyof TypeValue)[] = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing'];
const SAMPLE: Record<string, string> = { display: 'Rp1.250.000', heading: 'Bayar tagihan listrik', label: 'Top up saldo', caption: 'Diperbarui 2 Nov 2026, 09.41' };

const WEIGHT_NAME: Record<string, string> = { '400': 'Regular', '500': 'Medium', '600': 'SemiBold', '700': 'Bold' };
const subRef = (v: string) => (v.startsWith('{') ? resolve(get(v.slice(1, -1))) : v);

export function TypeScale() {
  const [p] = usePlatform();
  const styles = under('typography');
  return (
    <Wrap>
      <PlatformSwitch />
      <table className="cx-table cx-type">
        <thead><tr><th>Style</th><th>Sample</th><th>Spec</th></tr></thead>
        <tbody>
          {styles.map((t) => {
            const v = t.raw as TypeValue;
            const name = t.path.slice(1).join('/');
            const size = String(subRef(v.fontSize)), lh = String(subRef(v.lineHeight)), w = subRef(v.fontWeight);
            const style: React.CSSProperties = {
              fontFamily: cssVar([...t.path, 'fontFamily']), fontWeight: cssVar([...t.path, 'fontWeight']) as unknown as number,
              fontSize: cssVar([...t.path, 'fontSize']), lineHeight: cssVar([...t.path, 'lineHeight']), letterSpacing: cssVar([...t.path, 'letterSpacing']),
              fontVariantNumeric: t.path[1] === 'display' ? 'tabular-nums' : undefined,
            };
            return (
              <tr key={name}>
                <td style={{ width: 200 }}>
                  <div className="cx-name">{name}</div>
                  <div className="cx-muted">{t.description}</div>
                </td>
                <td><div style={style}>{SAMPLE[t.path[1]] ?? 'Bayar tagihan listrik dengan DOKU'}</div></td>
                <td style={{ width: 360 }}>
                  <div className="cx-spec">{size.replace('px', '')}/{lh.replace('px', '')} · Inter {WEIGHT_NAME[String(w)]} ({String(w)}){v.letterSpacing !== '0em' ? ` · ${v.letterSpacing}` : ''}</div>
                  {p === 'figma' ? <Copy text={name} /> : (
                    <div className="cx-props">
                      {PROPS.map((k) =>
                        k === 'letterSpacing' && v.letterSpacing === '0em' ? null : p === 'android' && (k === 'fontWeight' || k === 'letterSpacing') ? (
                          <span key={k} className="cx-muted cx-note">
                            {k === 'fontWeight' ? `Font: Inter ${WEIGHT_NAME[String(w)]} (res/font)` : `letterSpacing = ${v.letterSpacing.replace('em', '')}em (set in code)`}
                          </span>
                        ) : (
                          <Copy key={k} text={nameFor({ ...t, type: k === 'fontWeight' ? 'fontWeight' : 'dimension', path: [...t.path, k] }, p)} />
                        ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
}

/* --------------------------------------------------------- Spacing / shape */

const px = (t: Token) => parseFloat(String(resolve(t)));

export function SpacingScale({ group }: { group: 'spacing' | 'layout' }) {
  return (
    <Wrap>
      <table className="cx-table">
        <thead><tr><th>Token</th><th style={{ width: 72 }}>px · pt · dp</th><th>Scale</th></tr></thead>
        <tbody>
          {under(group).map((t) => (
            <tr key={t.path.join('.')}>
              <td><div className="cx-name">{t.path.join('/')}</div><TokenName t={t} /></td>
              <td className="cx-mono">{px(t)}</td>
              <td><div className="cx-bar" style={{ width: cssVar(t.path) }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Wrap>
  );
}

const RADIUS_USE: Record<string, string> = {
  none: 'Full-bleed images, dividers', xs: 'Badges, tags, checkbox', sm: 'Buttons, inputs, small cards', md: 'Cards, list containers, toasts',
  lg: 'Promo banners, large cards', xl: 'Bottom sheet (top corners), dialogs', full: 'Pills, avatars, toggles, FAB',
};
export function RadiusScale() {
  return (
    <Wrap>
      <div className="cx-grid">
        {under('radius').map((t) => (
          <div key={last(t)} className="cx-tile">
            <div className="cx-radius" style={{ borderRadius: cssVar(t.path) }} />
            <div className="cx-name">radius/{last(t)}</div>
            <div className="cx-muted">{px(t) >= 9999 ? '9999 (pill)' : `${px(t)}`} · {RADIUS_USE[last(t)]}</div>
            <TokenName t={t} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

const BORDER_USE: Record<string, string> = { none: 'No border', thin: 'Inputs, cards, dividers', thick: 'Focus ring, selected state' };
export function BorderWidths() {
  return (
    <Wrap>
      <div className="cx-grid">
        {under('border-width').map((t) => (
          <div key={last(t)} className="cx-tile">
            <div className="cx-border" style={{ borderWidth: cssVar(t.path), borderColor: last(t) === 'thick' ? 'var(--color-border-focus)' : 'var(--color-border-strong)' }} />
            <div className="cx-name">border-width/{last(t)}</div>
            <div className="cx-muted">{px(t)} · {BORDER_USE[last(t)]}</div>
            <TokenName t={t} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

/* --------------------------------------------------------------- Elevation */

const ANDROID_DP: Record<string, string> = { '1': '2dp', '2': '4dp', '3': '8dp', '4': '16dp', sheet: '16dp (top)' };
type Layer = { offsetX: string; offsetY: string; blur: string; spread: string; color: string };

export function ElevationScale() {
  const levels = under('elevation');
  return (
    <Wrap>
      <div className="cx-stage">
        {levels.map((t) => (
          <div key={last(t)} className="cx-elev">
            <div className="cx-elev-card" style={{ boxShadow: cssVar(t.path) }} />
            <div className="cx-name">elevation/{last(t)}</div>
            <div className="cx-muted">{t.description}</div>
          </div>
        ))}
      </div>
      <table className="cx-table">
        <thead><tr><th>Level</th><th>Layers (x y blur spread · opacity of neutral/950)</th><th>iOS (CurrencyElevation.swift)</th><th>Android (currency_elevation.xml)</th></tr></thead>
        <tbody>
          {levels.map((t) => {
            const layers = t.raw as Layer[];
            const op = (c: string) => Math.round((parseInt(c.slice(7), 16) / 255) * 100);
            const l2 = layers[1];
            return (
              <tr key={last(t)}>
                <td className="cx-name">elevation/{last(t)}</td>
                <td className="cx-mono">{layers.map((l) => `${parseFloat(l.offsetX)} ${parseFloat(l.offsetY)} ${parseFloat(l.blur)} ${parseFloat(l.spread)} · ${op(l.color)}%`).join('\n')}</td>
                <td>
                  <Copy text={`layer.applyCurrencyShadow(.${/^\d+$/.test(last(t)) ? 'level' + last(t) : last(t)})`} />
                  <div className="cx-muted cx-note">offset (0, {parseFloat(l2.offsetY)}) · radius {parseFloat(l2.blur) / 2} · opacity {(op(l2.color) / 100).toFixed(2)}</div>
                </td>
                <td>
                  <Copy text={`@dimen/elevation_${last(t)}`} />
                  <div className="cx-muted cx-note">{ANDROID_DP[last(t)]}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
}

export { PlatformSwitch };
