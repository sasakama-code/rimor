#!/usr/bin/env node
import { CLI } from './cli/cli';
import { getMessage } from './i18n/messages';

async function main() {
  const cli = new CLI();
  await cli.run();
}

main().catch((error) => {
  console.error(getMessage('cli.execution_error'), error);
  process.exit(1);
});