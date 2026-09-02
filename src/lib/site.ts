export const siteUrl = "https://www.natuurhout.be";

// Fail closed: staging stays blocked unless the cutover deployment explicitly
// opts into indexing with SITE_INDEXING_ENABLED=true.
export const siteIndexingEnabled = process.env.SITE_INDEXING_ENABLED === "true";
