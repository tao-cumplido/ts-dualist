#!/usr/bin/env node

import path from 'node:path';

import { $ } from 'execa';
import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import { loadJsonFile } from 'load-json-file';
import meow from 'meow';
import { writeJsonFile } from 'write-json-file';
import z from 'zod';

const cli = meow({
	importMeta: import.meta,
	flags: {
		project: {
			shortFlag: 'p',
			type: 'string',
			default: 'tsconfig.json',
		},
	},
});

const tsConfig: TsConfigJsonResolved & Record<string, unknown> = parseTsconfig(cli.flags.project);
const packageJson = z.record(z.unknown()).parse(await loadJsonFile('package.json'));

const dualistConfig = z.object({
	exports: z.record(z.string()).default({
		'.': 'index.ts',
	}),
}).parse(packageJson['ts-dualist'] ?? tsConfig['ts-dualist'] ?? {});

const { compilerOptions = {} } = tsConfig;

const { outDir = 'dist' } = compilerOptions;

for (const type of ['module', 'commonjs']) {
	packageJson.type = type;
	await writeJsonFile('package.json', packageJson, { detectIndent: true });
	await $`tsc --project ${cli.flags.project} --outDir ${path.join(outDir, type)}`;
	await writeJsonFile(path.join(outDir, type, 'package.json'), { type });
}

delete packageJson.type;

const exports: any = packageJson.exports ?? {};

for (const [entryPoint, source] of Object.entries(dualistConfig.exports)) {
	const { dir, name } = path.posix.parse(source);

	const makeExport = (type: string) => {
		const artifactDir = path.posix.join(outDir, type, dir);
		return {
			types: `./${artifactDir}/${name}.d.ts`,
			default: `./${artifactDir}/${name}.js`,
		};
	};

	exports[entryPoint] = {
		import: makeExport('module'),
		require: makeExport('commonjs'),
	};

	if (entryPoint === '.') {
		packageJson.types = exports['.'].require.types;
		packageJson.main = exports['.'].require.default;
	}
}

packageJson.exports = exports;

await writeJsonFile('package.json', packageJson, { detectIndent: true });
