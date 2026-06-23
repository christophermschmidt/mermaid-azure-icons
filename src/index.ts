import type { Mermaid } from 'mermaid';

// IconifyJSON structure matches our dist/fabric.json and dist/azure.json
interface IconifyJSON {
  prefix: string;
  icons: Record<string, { body: string; width?: number; height?: number }>;
}

export type IconPackLoader = () => Promise<IconifyJSON>;

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/mermaid-azure-icons@latest/dist';

function makeLoader(filename: string): IconPackLoader {
  return () =>
    fetch(`${CDN_BASE}/${filename}`).then((r) => {
      if (!r.ok) {
        throw new Error(
          `mermaid-azure-icons: failed to load ${filename} (HTTP ${r.status}). ` +
          `Check that the package is published and the CDN is reachable.`
        );
      }
      return r.json() as Promise<IconifyJSON>;
    });
}

/**
 * Registers the Fabric icon pack with a Mermaid instance.
 * Icons are lazy-loaded from jsDelivr CDN unless a custom loader is provided.
 *
 * @example
 * import mermaid from 'mermaid';
 * import { registerFabricIcons } from 'mermaid-azure-icons';
 * registerFabricIcons(mermaid);
 * // Use fabric:lakehouse, fabric:eventhouse, fabric:eventstream, etc.
 */
export function registerFabricIcons(
  mermaidInstance: Mermaid,
  loader?: IconPackLoader
): void {
  mermaidInstance.registerIconPacks([
    { name: 'fabric', loader: (loader ?? makeLoader('fabric.json')) as any }
  ]);
}

/**
 * Registers the Azure icon pack with a Mermaid instance.
 * Icons are lazy-loaded from jsDelivr CDN unless a custom loader is provided.
 *
 * @example
 * import mermaid from 'mermaid';
 * import { registerAzureIcons } from 'mermaid-azure-icons';
 * registerAzureIcons(mermaid);
 * // Use azure:event-hubs, azure:data-factory, azure:openai, etc.
 */
export function registerAzureIcons(
  mermaidInstance: Mermaid,
  loader?: IconPackLoader
): void {
  mermaidInstance.registerIconPacks([
    { name: 'azure', loader: (loader ?? makeLoader('azure.json')) as any }
  ]);
}

/**
 * Registers both Fabric and Azure icon packs in one call.
 *
 * @example
 * import mermaid from 'mermaid';
 * import { registerAllIcons } from 'mermaid-azure-icons';
 * registerAllIcons(mermaid);
 */
export function registerAllIcons(mermaidInstance: Mermaid): void {
  registerFabricIcons(mermaidInstance);
  registerAzureIcons(mermaidInstance);
}

export default { registerFabricIcons, registerAzureIcons, registerAllIcons };
