import type { NextConfig } from "next";

const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "bjj_tournament_system";
const basePath = isGithubPagesBuild ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
	trailingSlash: true,
	basePath,
};

export default nextConfig;
