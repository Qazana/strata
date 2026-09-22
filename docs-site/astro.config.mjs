import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';

// Per-product docs subdomain (GitHub Pages; Cloudflare CNAME strata.docs -> qazana.github.io)
const SITE = 'https://strata.docs.qazana.net';
const BASE = '/';
const GA_MEASUREMENT_ID = 'G-MBB3JL4ZXM';

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [
    starlight({
      title: 'Qazana Strata',
      description:
        'One style base, no build step, no framework — design tokens (CSS variables) + vanilla data-attribute behaviours, themeable per product.',
      head: [
        {
          tag: 'script',
          attrs: {
            async: true,
            src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
          },
        },
        {
          tag: 'script',
          content: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
          `.trim(),
        },
      ],
      // Serves /llms.txt, /llms-full.txt and /llms-small.txt so coding agents
      // can read the docs as plain markdown.
      plugins: [
        starlightLlmsTxt({
          details: [
            'Rules for code that uses Strata:',
            '',
            '- Never hardcode a color, radius, spacing, shadow, font or duration. Use a token, e.g. `var(--primary)`, `var(--space-3)`.',
            '- Alpha tints use the channel form: `rgb(var(--primary-rgb) / .12)`.',
            '- Behavior attaches through `data-*` hooks on plain markup. There is no framework and no build step.',
            '- Re-brand a product with one `:root {}` override of the semantic tokens.',
            '- Only documented tokens, classes, DOM anatomy and `data-*` hooks are stable public API.',
          ].join('\n'),
          promote: ['getting-started/**', 'foundations/tokens', 'foundations/theming'],
          demote: ['reference/changelog'],
          optionalLinks: [
            {
              label: 'Public API contract',
              url: 'https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md',
              description: 'What counts as stable public surface and how it may change.',
            },
          ],
        }),
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Qazana/strata' },
        { icon: 'figma', label: 'Figma library', href: 'https://www.figma.com/design/bcPBKFlIq3QmtGDPCpd6I2/Qazana-Strata--Design-System?node-id=44-2' },
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
            { label: 'Commerce', link: '/kits/commerce/' },
            { label: 'Billing', link: '/kits/billing/' },
            { label: 'Docs', link: '/kits/docs/' },
            { label: 'Support', link: '/kits/support/' },
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
        {
          label: 'Qazana',
          items: [
            { label: 'Strata marketing site', link: 'https://strata.qazana.net/' },
            { label: 'All Qazana docs', link: 'https://docs.qazana.net/' },
            { label: 'qazana.net', link: 'https://qazana.net/' },
            { label: 'Figma library', link: 'https://www.figma.com/design/bcPBKFlIq3QmtGDPCpd6I2/Qazana-Strata--Design-System?node-id=44-2' },
            { label: 'npm package', link: 'https://www.npmjs.com/package/@qazana/strata' },
          ],
        },
      ],
    }),
  ],
});
