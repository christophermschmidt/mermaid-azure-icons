# mermaid-azure-icons

> Official Microsoft Azure and Fabric SVG icons as Mermaid-compatible Iconify packs.

Use real Microsoft service icons in `architecture-beta` Mermaid diagrams — in VS Code,
Docusaurus, Hugo, Claude chat, and anywhere else Mermaid renders.

## Quick start

### CDN (no build step)

```html

  import mermaid from 'https://unpkg.com/mermaid/dist/mermaid.esm.min.mjs';
  mermaid.registerIconPacks([
    {
      name: 'fabric',
      loader: () => fetch('https://unpkg.com/mermaid-azure-icons/dist/fabric.json').then(r => r.json())
    },
    {
      name: 'azure',
      loader: () => fetch('https://unpkg.com/mermaid-azure-icons/dist/azure.json').then(r => r.json())
    }
  ]);

```

### npm

```bash
npm install mermaid-azure-icons
```

```js
import mermaid from 'mermaid';
import { registerFabricIcons, registerAzureIcons } from 'mermaid-azure-icons';

registerFabricIcons(mermaid);
registerAzureIcons(mermaid);
```

## Diagram syntax
```
architecture-beta
group ws(azure:microsoft-fabric)[Fabric Workspace]

service lh(fabric:lakehouse)[Lakehouse Bronze] in ws
service es(fabric:eventstream)[Eventstream] in ws
service eh(fabric:eventhouse)[Eventhouse] in ws
service df(fabric:data-factory)[Data Factory] in ws

lh:R --> L:es
es:R --> L:eh
df:B --> T:lh

```
## Available icon prefixes

| Prefix | Source | Count |
|--------|--------|-------|
| `fabric` | `@fabric-msft/svg-icons` (official Microsoft npm) | ~200 |
| `azure` | Azure Architecture Center + benc-uk/icon-collection | ~400 |

See [docs/icon-catalogue.md](docs/icon-catalogue.md) for all icon slugs.

## Auto-update

Icons are rebuilt weekly via GitHub Actions, tracking the latest upstream versions.

## Copilot / Claude context

`.github/copilot-instructions.md` contains the full icon catalogue and diagram syntax
rules. GitHub Copilot reads it automatically. For Claude, attach it as a Project
instruction or upload it at the start of a session.

## License

MIT. Icons sourced from:
- `@fabric-msft/svg-icons` — MIT, Microsoft
- Azure Architecture Center — Microsoft (permitted for architectural diagrams)
- benc-uk/icon-collection — fair use aggregation
