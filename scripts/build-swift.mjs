import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function main() {
  console.log('Building Swift binary for Apple Reminders MCP Server...');

  if (process.platform !== 'darwin') {
    console.error(
      'Error: This project requires macOS to compile Swift binaries.',
    );
    process.exit(1);
  }

  try {
    await execAsync('which swiftc');
  } catch (_error) {
    console.error('Error: Swift compiler (swiftc) not found.');
    console.error(
      'Please install Xcode or Xcode Command Line Tools: xcode-select --install',
    );
    process.exit(1);
  }

  const scriptDir = path.resolve(process.cwd(), 'src', 'swift');
  const sourceFile = path.join(scriptDir, 'EventKitCLI.swift');
  const binDir = path.resolve(process.cwd(), 'bin');
  const outputFile = path.join(binDir, 'EventKitCLI');

  try {
    await fs.access(sourceFile);
  } catch (_error) {
    console.error(`Error: Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  await fs.mkdir(binDir, { recursive: true });

  const compileCommand = `swiftc -o "${outputFile}" "${sourceFile}" -framework EventKit -framework Foundation`;

  console.log(`Compiling ${sourceFile}...`);

  try {
    const { stdout, stderr } = await execAsync(compileCommand);
    if (stderr) {
      console.warn(`Swift compiler warnings:\n${stderr}`);
    }
    if (stdout) {
      console.log(stdout);
    }

    console.log(`Compilation successful! Binary saved to ${outputFile}`);

    await fs.chmod(outputFile, '755');
    console.log('Binary is now executable.');
    console.log('Swift binary build complete!');
  } catch (error) {
    console.error('Compilation failed!');
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    'An unexpected error occurred during the build process:',
    error,
  );
  process.exit(1);
});
