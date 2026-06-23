/*
Gradient collision problem:
- Before: icon A and icon B both define id="a" and reference fill="url(#a)".
	When many SVG bodies are inlined into one Iconify JSON pack, those IDs collide.
	The second icon's gradient definition can override the first, causing wrong colors.
- After namespacing: icon A uses id="fabric-lakehouse-a" and icon B uses
	id="fabric-eventhouse-a". Each icon references its own unique ID, so no collisions.
*/

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function namespaceIds(svgBody: string, iconSlug: string, prefix: string): string {
	const idRegex = /\bid\s*=\s*(["'])([^"']+)\1/g;
	const ids = new Set<string>();

	// Pass 1: collect all unique IDs first.
	let match: RegExpExecArray | null;
	while ((match = idRegex.exec(svgBody)) !== null) {
		ids.add(match[2]);
	}

	// Pass 2: replace all matching references using exact-value patterns.
	let updated = svgBody;
	for (const id of ids) {
		const namespaced = `${prefix}-${iconSlug}-${id}`;
		const escapedId = escapeRegExp(id);

		updated = updated.replace(new RegExp(`\\bid\\s*=\\s*"${escapedId}"`, "g"), `id="${namespaced}"`);
		updated = updated.replace(new RegExp(`\\bid\\s*=\\s*'${escapedId}'`, "g"), `id='${namespaced}'`);

		updated = updated.replace(new RegExp(`url\\(#${escapedId}\\)`, "g"), `url(#${namespaced})`);

		updated = updated.replace(new RegExp(`\\bhref\\s*=\\s*"#${escapedId}"`, "g"), `href="#${namespaced}"`);
		updated = updated.replace(new RegExp(`\\bhref\\s*=\\s*'#${escapedId}'`, "g"), `href='#${namespaced}'`);

		updated = updated.replace(
			new RegExp(`\\bxlink:href\\s*=\\s*"#${escapedId}"`, "g"),
			`xlink:href="#${namespaced}"`
		);
		updated = updated.replace(
			new RegExp(`\\bxlink:href\\s*=\\s*'#${escapedId}'`, "g"),
			`xlink:href='#${namespaced}'`
		);
	}

	return updated;
}
