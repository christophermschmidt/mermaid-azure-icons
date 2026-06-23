import { promises as fs } from "node:fs";
import path from "node:path";

type GitHubContentItem = {
	name: string;
	download_url: string | null;
	type: string;
};

const ROOT_DIR = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT_DIR, "raw");
const FABRIC_RAW_DIR = path.join(RAW_DIR, "fabric");
const AZURE_RAW_DIR = path.join(RAW_DIR, "azure");

const AZURE_CONTENT_API = "https://api.github.com/repos/benc-uk/icon-collection/contents/azure-cds";
const AZURE_SOURCE_NAME = "benc-uk/icon-collection (azure-cds)";

async function resetDirectory(dir: string): Promise<void> {
	await fs.rm(dir, { recursive: true, force: true });
	await fs.mkdir(dir, { recursive: true });
}

async function fetchFabricIcons(): Promise<{ count: number; version: string }> {
	let packageJsonPath: string;
	try {
		packageJsonPath = require.resolve("@fabric-msft/svg-icons/package.json");
	} catch {
		console.error("Run npm install first");
		process.exit(1);
	}

	const packageDir = path.dirname(packageJsonPath);
	const svgSourceDir = path.join(packageDir, "dist", "svg");

	try {
		const stat = await fs.stat(svgSourceDir);
		if (!stat.isDirectory()) {
			console.error("Run npm install first");
			process.exit(1);
		}
	} catch {
		console.error("Run npm install first");
		process.exit(1);
	}

	const packageJsonRaw = await fs.readFile(packageJsonPath, "utf8");
	const packageJson = JSON.parse(packageJsonRaw) as { version?: string };
	const version = packageJson.version ?? "unknown";

	const files = await fs.readdir(svgSourceDir);
	const svgFiles = files.filter((name) => name.toLowerCase().endsWith(".svg"));

	await Promise.all(
		svgFiles.map(async (name) => {
			await fs.copyFile(path.join(svgSourceDir, name), path.join(FABRIC_RAW_DIR, name));
		})
	);

	console.log(`Copied ${svgFiles.length} Fabric icons from @fabric-msft/svg-icons@${version}`);
	return { count: svgFiles.length, version };
}

async function fetchAzureIcons(): Promise<number> {
	const response = await fetch(AZURE_CONTENT_API, {
		headers: {
			"User-Agent": "mermaid-azure-icons",
			Accept: "application/vnd.github+json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to list Azure icons: ${response.status} ${response.statusText}`);
	}

	const items = (await response.json()) as GitHubContentItem[];
	const svgItems = items.filter((item) => {
		return item.type === "file" && item.name.toLowerCase().endsWith(".svg") && typeof item.download_url === "string";
	});

	let completed = 0;
	let nextIndex = 0;
	const total = svgItems.length;
	const concurrency = Math.min(5, total || 1);

	const worker = async (): Promise<void> => {
		while (true) {
			const index = nextIndex;
			nextIndex += 1;

			if (index >= total) {
				return;
			}

			const item = svgItems[index];
			const downloadUrl = item.download_url;
			if (!downloadUrl) {
				continue;
			}

			const svgResponse = await fetch(downloadUrl, {
				headers: {
					"User-Agent": "mermaid-azure-icons",
					Accept: "image/svg+xml",
				},
			});

			if (!svgResponse.ok) {
				throw new Error(`Failed to download ${item.name}: ${svgResponse.status} ${svgResponse.statusText}`);
			}

			const svg = await svgResponse.text();
			await fs.writeFile(path.join(AZURE_RAW_DIR, item.name), svg, "utf8");

			completed += 1;
			if (completed % 25 === 0 || completed === total) {
				console.log(`Fetched ${completed}/${total} Azure icons...`);
			}
		}
	};

	await Promise.all(Array.from({ length: concurrency }, () => worker()));

	console.log(`Fetched ${completed} Azure icons from benc-uk/icon-collection`);
	return completed;
}

async function writeManifest(fabricCount: number, azureCount: number, fabricVersion: string): Promise<void> {
	const manifest = {
		fetchedAt: new Date().toISOString(),
		fabricCount,
		azureCount,
		fabricSource: `@fabric-msft/svg-icons@${fabricVersion}`,
		azureSource: AZURE_SOURCE_NAME,
	};

	await fs.writeFile(path.join(RAW_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
	await fs.mkdir(RAW_DIR, { recursive: true });
	await resetDirectory(FABRIC_RAW_DIR);
	await resetDirectory(AZURE_RAW_DIR);

	const fabric = await fetchFabricIcons();
	const azureCount = await fetchAzureIcons();

	await writeManifest(fabric.count, azureCount, fabric.version);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
