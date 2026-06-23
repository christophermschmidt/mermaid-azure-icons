import path from "node:path";

// Examples:
// lakehouse_48_item.svg -> lakehouse
// eventhouse_32_item.svg -> eventhouse
// data_factory_20_item.svg -> data-factory
// real_time_dashboard_48_item.svg -> real-time-dashboard
// ai_skill_20_item.svg -> ai-skill
export function toSlug(filename: string): string {
	let slug = path.basename(filename, path.extname(filename));

	// Remove known suffixes in repeated passes so patterns like _48_item are fully removed.
	let previous = "";
	while (slug !== previous) {
		previous = slug;
		slug = slug.replace(/_(item|experience|product|icon)$/i, "");
		slug = slug.replace(/_(48|32|20|16|24)$/i, "");
	}

	return slug.toLowerCase().replace(/_/g, "-");
}

// Examples:
// 10121-icon-service-Event-Hubs.svg -> event-hubs
// 00756-icon-service-Azure-OpenAI.svg -> azure-openai
// 10222-icon-service-Data-Factory.svg -> data-factory
// 10121-icon-service-Microsoft-Fabric.svg -> microsoft-fabric
// 10140-icon-service-Azure-Purview.svg -> azure-purview
export function toAzureSlug(filename: string): string {
	const base = path.basename(filename, path.extname(filename));
	const withoutPrefix = base.replace(/^\d+[-_\s]*icon[-_\s]*service[-_\s]*/i, "");

	return withoutPrefix
		.toLowerCase()
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
