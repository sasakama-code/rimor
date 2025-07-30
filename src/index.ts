#!/usr/bin/env node
import { CLI } from './cli/cli';

async function main() {
  const cli = new CLI();
  await cli.run();
}

main().catch((error) => {
  console.error("Error:", error.message || error);
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  process.exit(1);
});