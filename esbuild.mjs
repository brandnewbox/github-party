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
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
      // TODO IAN questions:
      // 1) why are we getting localhost:1999 in prod?
      // 2) what sets that url in prod?
      // 3) where do we expect that PARTY_HOST needs to be defined for prod so that it 
      // can be used instead of localhost:1999?
      // TODO IAN the robot says when we run partykit deploy partykit gives us a deployment url and w eneed to use that as the partyhost value
      // but that all seems like what we did before... are we already doing that? if not what did we do before?
      "process.env.PARTY_HOST": `"${process.env.PARTY_HOST}"`
    },
    plugins: [copyManifestPlugin]
  })
  .catch(() => process.exit(1));