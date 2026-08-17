import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

const extensionDir = path.resolve('../extension');
const outputDir = path.resolve('./public');
const outputPath = path.resolve(outputDir, 'meetsense-extension.zip');

async function zipDirectory() {
  console.log(`Starting to zip ${extensionDir} into ${outputPath}...`);

  // Ensure public folder exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create write stream
  const output = fs.createWriteStream(outputPath);
  const archive = new ZipArchive({
    zlib: { level: 9 } // maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Zip archive created successfully: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    
    // Append files from extension folder, putting its contents at root level in the archive
    archive.directory(extensionDir, false);

    archive.finalize();
  });
}

zipDirectory().catch(err => {
  console.error('Failed to create extension zip archive:', err);
  process.exit(1);
});
