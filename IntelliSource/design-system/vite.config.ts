import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Library build so ASP.NET Core MVC hosts (React islands, ADR-02) can consume
// the design system as a package. Storybook uses its own Vite pipeline.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IntelliSourceDesignSystem',
      formats: ['es'],
      fileName: 'intellisource-design-system',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
});
