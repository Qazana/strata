import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages project site: https://qazana.github.io/strata/
const SITE = 'https://qazana.github.io';
const BASE = '/strata';

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [
    starlight({
      title: 'Qazana Strata',
      description:
        'Framework-agnostic, token-driven design system — vanilla CSS + data-attribute behaviours, themeable per product.',
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/qazana/strata' },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Install', link: '/getting-started/install/' },
            { label: 'Vanilla / HTML', link: '/getting-started/vanilla/' },
            { label: 'React + Tailwind', link: '/getting-started/react-tailwind/' },
            { label: 'Ember', link: '/getting-started/ember/' },
          ],
        },
        {
          label: 'Foundations',
          items: [
            { label: 'Tokens', link: '/foundations/tokens/' },
            { label: 'Typography', link: '/foundations/typography/' },
            { label: 'Layout', link: '/foundations/layout/' },
            { label: 'Theming', link: '/foundations/theming/' },
            { label: 'Density', link: '/foundations/density/' },
            { label: 'Accessibility', link: '/foundations/accessibility/' },
            { label: 'Motion', link: '/foundations/motion/' },
            { label: 'Responsive', link: '/foundations/responsive/' },
          ],
        },
        {
          label: 'Kits',
          items: [
            { label: 'App', link: '/kits/app/' },
            { label: 'Site', link: '/kits/site/' },
            { label: 'Content', link: '/kits/content/' },
            { label: 'Auth', link: '/kits/auth/' },
            { label: 'Email', link: '/kits/email/' },
            { label: 'Media', link: '/kits/media/' },
          ],
        },
        {
          label: 'Components',
          autogenerate: { directory: 'components' },
        },
        {
          label: 'Guides',
          items: [
            { label: 'Brand a product', link: '/guides/brand-a-product/' },
            { label: 'Build domain components', link: '/guides/domain-components/' },
            { label: 'Contributing', link: '/guides/contributing/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Philosophy & lessons', link: '/reference/philosophy/' },
            { label: 'Changelog', link: '/reference/changelog/' },
          ],
        },
      ],
    }),
  ],
});
