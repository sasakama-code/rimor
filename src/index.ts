#!/usr/bin/env node
import { CLI } from './cli/cli';

async function main() {
  const cli = new CLI();
  await cli.run();
}

main().catch((error) => {
  console.error('CLI実行中にエラーが発生しました:', error);
  process.exit(1);
});