import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Plugin to copy manifest.json to output directory
const copyManifestPlugin = {
  name: 'copy-manifest',
  setup(build) {
    build.onEnd(() => {
      const manifestPath = path.join(process.cwd(), 'web-extension', 'manifest.json');
      const outputPath = path.join(process.cwd(), 'web-extension-dist', 'manifest.json');
      
      // Ensure the output directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Copy the manifest file
      fs.copyFileSync(manifestPath, outputPath);
      console.log('✓ Copied manifest.json to web-extension-dist');
    });
  },
};

esbuild
  .build({
    entryPoints: [
      "./web-extension/content.ts"
    ],
    bundle: true,
    minify: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome58", "firefox57"],
    outdir: "./web-extension-dist",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`
    },
    plugins: [copyManifestPlugin]
  })
  .catch(() => process.exit(1));