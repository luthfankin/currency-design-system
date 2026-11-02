import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    { name: '@storybook/addon-essentials', options: { docs: false } },
    // GitHub-flavoured Markdown so tables in the .mdx pages render
    { name: '@storybook/addon-docs', options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { defaultName: 'Docs' },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
};
export default config;
