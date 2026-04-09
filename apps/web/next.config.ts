import type { NextConfig } from "next";

// SVGR support for both Turbopack (dev) and Webpack (build / when turbopack is disabled)
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { icon: true },
          },
        ],
        as: "*.js",
      },
    },
  },

  webpack(config) {
    // Exclude .svg from Next's default asset rule (so SVGR can handle it)
    const rules = config.module?.rules ?? [];
    const assetRule = rules.find((r: any) => r?.test && r.test instanceof RegExp && r.test.test(".svg"));
    if (assetRule) {
      assetRule.exclude = /\.svg$/i;
    }

    rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: { icon: true },
        },
      ],
    });

    config.module.rules = rules;
    return config;
  },
};

export default nextConfig;
