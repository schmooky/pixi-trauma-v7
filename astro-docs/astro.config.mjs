// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.trauma.ddstnd.space',
  base: '/',
  integrations: [starlight({
    title: 'PIXI Trauma',
    logo: {
      src: './src/assets/pixijs-logo.svg'
    },
    social: {
      github: 'https://github.com/schmooky'
    },
    sidebar: [{
      label: '[home] Home',
      link: '/'
    }, {
      label: '[list] Features',
      link: '/features/'
    }, {
      label: '[box] Guides',
      autogenerate: {
        directory: 'guides'
      }
    }, {
      label: '[book] Reference',
      autogenerate: {
        directory: 'reference'
      }
    }],
    components: {
      ThemeProvider: './src/components/ThemeProvider.astro',
      ThemeSelect: './src/components/ThemeSelect.astro',
      SiteTitle: './src/components/SiteTitle.astro',
      Sidebar: './src/components/Sidebar.astro',
      Pagination: './src/components/Pagination.astro',
      Hero: './src/components/Hero.astro',
      Head: './src/components/Head.astro',
      PageTitle: './src/components/PageTitle.astro'
    },
    customCss: [
      '@fontsource-variable/space-grotesk/index.css',
      '@fontsource/space-mono/400.css',
      '@fontsource/space-mono/700.css',
      './src/styles/highlight.css',
      './src/styles/editor.css',
      './src/styles/theme.css',
    ],
    expressiveCode: {
      themes: ['github-dark']
    },
    pagination: false,
    lastUpdated: true
  })],
  output: "static"
});