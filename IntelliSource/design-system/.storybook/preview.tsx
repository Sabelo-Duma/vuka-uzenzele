import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      // axe runs against every story; CI gate = 0 critical/serious (NFR-A11Y-06)
      config: {},
      options: {},
    },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story) => (
      <div className="font-gj text-gj-base text-gj-text bg-gj-bg p-gj-6 min-h-24">
        <Story />
      </div>
    ),
  ],
};

export default preview;
