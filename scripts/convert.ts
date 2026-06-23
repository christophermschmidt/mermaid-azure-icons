import { promises as fs } from "node:fs";
import path from "node:path";
import { namespaceIds } from "./utils/namespace-ids";
import { toAzureSlug, toSlug } from "./utils/slug";

type IconEntry = {
	body: string;
	width: number;
	height: number;
};

type IconPack = {
	prefix: string;
	icons: Record<string, IconEntry>;
};

type CandidateIcon = {
	slug: string;
	entry: IconEntry;
	sourceFile: string;
	sizeRank: number;
};

const ROOT_DIR = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT_DIR, "raw");

const SIZE_PRIORITY: Record<number, number> = {
	48: 5,
	32: 4,
	24: 3,
	20: 2,
	16: 1,
};

function parseSvgDimensions(svg: string): { width: number; height: number } {
	const svgOpenTagMatch = svg.match(/<svg\b[^>]*>/i);
	if (!svgOpenTagMatch) {
		throw new Error("Missing <svg> wrapper");
	}

	const svgOpenTag = svgOpenTagMatch[0];
	const viewBoxMatch = svgOpenTag.match(/\bviewBox\s*=\s*(["'])([^"']+)\1/i);
	if (viewBoxMatch) {
		const parts = viewBoxMatch[2].trim().split(/\s+/);
		if (parts.length === 4) {
			const width = Number(parts[2]);
			const height = Number(parts[3]);
			if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
				return { width, height };
			}
		}
	}

	const widthMatch = svgOpenTag.match(/\bwidth\s*=\s*(["'])([^"']+)\1/i);
	const heightMatch = svgOpenTag.match(/\bheight\s*=\s*(["'])([^"']+)\1/i);
	if (widthMatch && heightMatch) {
		const width = Number(String(widthMatch[2]).replace(/px$/i, ""));
		const height = Number(String(heightMatch[2]).replace(/px$/i, ""));
		if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
			return { width, height };
		}
	}

	return { width: 48, height: 48 };
}

function extractSvgBody(svg: string): string {
	const bodyMatch = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
	if (!bodyMatch) {
		throw new Error("Unable to extract SVG body");
	}
	return bodyMatch[1].trim();
}

function sizeRankFromFilename(filename: string, entry: IconEntry): number {
	const match = filename.match(/_(48|32|24|20|16)(?=(_|\.|$))/i);
	if (match) {
		return SIZE_PRIORITY[Number(match[1])] ?? 0;
	}
	const numeric = Math.max(entry.width, entry.height);
	return SIZE_PRIORITY[numeric] ?? 0;
}

async function readSvgFiles(dir: string): Promise<string[]> {
	const files = await fs.readdir(dir);
	return files.filter((name) => name.toLowerCase().endsWith(".svg"));
}

async function convertDirectory(options: {
	sourceDir: string;
	prefix: "fabric" | "azure";
	slugger: (filename: string) => string;
}): Promise<IconPack> {
	const files = await readSvgFiles(options.sourceDir);
	const selected = new Map<string, CandidateIcon>();

	for (const filename of files) {
		const filePath = path.join(options.sourceDir, filename);
		try {
			const svg = await fs.readFile(filePath, "utf8");
			const slug = options.slugger(filename);
			if (!slug) {
				throw new Error("Empty slug after normalization");
			}

			const dimensions = parseSvgDimensions(svg);
			const body = extractSvgBody(svg);
			const namespacedBody = namespaceIds(body, slug, options.prefix);

			const entry: IconEntry = {
				body: namespacedBody,
				width: dimensions.width,
				height: dimensions.height,
			};

			const candidate: CandidateIcon = {
				slug,
				entry,
				sourceFile: filename,
				sizeRank: sizeRankFromFilename(filename, entry),
			};

			const existing = selected.get(slug);
			if (!existing) {
				selected.set(slug, candidate);
				continue;
			}

			if (candidate.sizeRank > existing.sizeRank) {
				console.warn(
					`WARN duplicate slug ${slug}: replacing ${existing.sourceFile} with ${candidate.sourceFile} (larger size)`
				);
				selected.set(slug, candidate);
			} else {
				console.warn(
					`WARN duplicate slug ${slug}: keeping ${existing.sourceFile}, skipping ${candidate.sourceFile}`
				);
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`SKIP ${filename}: ${message}`);
		}
	}

	const icons: Record<string, IconEntry> = {};
	for (const [slug, candidate] of Array.from(selected.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
		icons[slug] = candidate.entry;
	}

	return {
		prefix: options.prefix,
		icons,
	};
}

async function main(): Promise<void> {
	const fabricSourceDir = path.join(RAW_DIR, "fabric");
	const azureSourceDir = path.join(RAW_DIR, "azure");

	const fabricPack = await convertDirectory({
		sourceDir: fabricSourceDir,
		prefix: "fabric",
		slugger: toSlug,
	});

	const azurePack = await convertDirectory({
		sourceDir: azureSourceDir,
		prefix: "azure",
		slugger: toAzureSlug,
	});

	await fs.writeFile(path.join(RAW_DIR, "fabric-converted.json"), `${JSON.stringify(fabricPack, null, 2)}\n`, "utf8");
	await fs.writeFile(path.join(RAW_DIR, "azure-converted.json"), `${JSON.stringify(azurePack, null, 2)}\n`, "utf8");

	const fabricCount = Object.keys(fabricPack.icons).length;
	const azureCount = Object.keys(azurePack.icons).length;

	console.log(`Converted ${fabricCount} Fabric icons`);
	console.log(`Converted ${azureCount} Azure icons`);

	if (fabricCount < 5 || azureCount < 5) {
		console.error("Conversion produced too few icons; expected at least 5 per pack");
		process.exit(1);
	}
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
