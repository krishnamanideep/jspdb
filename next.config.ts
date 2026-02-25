import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
    const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.replace(/.*?\//, '') : '';
    if (repo) {
        assetPrefix = `/${repo}/`;
        basePath = `/${repo}`;
    }
}

const nextConfig: NextConfig = {
    output: 'export',
    assetPrefix,
    basePath,
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
