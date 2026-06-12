# Design → dev handoff

How the Figma design system and this code library stay in lock-step.

## Source of truth
- **Code:** `tokens/qazana.tokens.css` is authoritative for values.
- **Figma:** `tokens/tokens.json` is the export consumed by Figma (via the
  Tokens Studio plugin) to create/update Figma **variables**. Same names, same
  values. When either side changes a token, update both and bump the version.

## Token map (Figma variable → CSS token)
| Figma variable        | CSS token            | Notes |
|-----------------------|----------------------|-------|
| color/primary         | `--primary`          | brand; themed per product |
| color/on-primary      | `--on-primary`       | text on a primary fill |
| color/danger          | `--danger`           | destructive / outflow |
| color/warning         | `--warning`          | |
| color/info            | `--info`             | |
| color/accent          | `--accent`           | categorical / tier |
| color/bg…muted        | `--bg` … `--muted`   | neutral surfaces/text |
| radius/sm,base,lg,pill| `--radius-*`         | |
| space/1…7             | `--space-*`          | 4·8·12·16·24·32·48 |
| shadow/sm,base,lg     | `--shadow*`          | elevation |
| font/display,body,mono| `--display/body/mono`| Figtree (large headings only) / DM Sans / mono |

## Alpha tints
In Figma, derive soft fills / rings as the brand color at the documented opacity
(soft 12%, ring 22%, line 30%). In code these are `rgb(var(--primary-rgb) / .12)`
so a brand override re-tints automatically.

## Components
Each library component maps 1:1 to a Figma component. The live spec is the
**demo** (`demo/`) — it shows every variant/state. A Figma component is "done"
when it matches the demo's variants and uses only the variables above.

## Theming a new product
1. Add `themes/<product>.css` overriding `--primary` (+ `-rgb`), `--on-primary`,
   fonts. 2. Create a matching Figma mode/collection. 3. Verify the demo under
   the new theme.
