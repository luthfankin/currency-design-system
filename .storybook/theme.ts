import { create } from '@storybook/theming/create';

// Inter everywhere (UI, docs text and code); the platform system font is the fallback.
export const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

export default create({
  base: 'light',
  brandTitle: 'Currency 2.0 · DOKU e-Wallet',
  brandUrl: 'https://www.figma.com/design/TORXr3LEX2YXuMkSOQ2C8C/',
  brandTarget: '_blank',
  colorPrimary: '#CC000B',
  colorSecondary: '#CC000B',
  fontBase: FONT,
  fontCode: FONT,
  appBg: '#F6F6F7',
  appBorderColor: '#E9E9EA',
  textColor: '#29292A',
});
