import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Currency 2.0 · DOKU e-Wallet',
    brandUrl: 'https://www.figma.com/design/TORXr3LEX2YXuMkSOQ2C8C/',
    brandTarget: '_blank',
    colorPrimary: '#CC000B',
    colorSecondary: '#CC000B',
    fontBase: '"Inter", system-ui, sans-serif',
    appBg: '#F6F6F7',
    appBorderColor: '#E9E9EA',
    textColor: '#29292A',
  }),
});
