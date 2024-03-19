#!/usr/bin/env node
// UNUSED
// @ts-nocheck

import { cac } from 'cac';
import fs from 'node:fs/promises';

main();
export async function main() {
	const cli = cac('@http-rpc/client');

	cli
		.command('generate', 'Generate client code')
		.option('--input <input>', 'Input router file')
		.option('--output <output>', 'Output directory')
		.option('--watch', 'Watch mode')
		.action(async options => {
			if (!options.input) throw new Error('Input file is required');
			if (!options.output) throw new Error('Output directory is required');
			console.log(options);

			// read input file
			// generate all type
			// write to output directory

			const routerFile = await fs.readFile(options.input, 'utf-8');
			console.log(routerFile);
		});

	cli.help();

	cli.parse();
}
