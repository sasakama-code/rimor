#!/usr/bin/env node
import { CLI } from './cli/cli.js';

async function main() {
  const cli = new CLI();
  await cli.run();
}

main().catch((error) => {
  console.error("");
  process.exit(1);
});