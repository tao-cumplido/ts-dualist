#!/usr/bin/env node

import path from 'node:path';

import { $ } from 'execa';
import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import { loadJsonFile } from 'load-json-file';
import { getFlag } from 'type-flag';
import { writeJsonFile } from 'write-json-file';
import z from 'zod';

const args = process.argv.slice(2);

if (getFlag('--build,-b,--watch,-w', Boolean)) {
	throw new Error(`Build or watch mode not supported.`);
}

const project = getFlag('--project,-p', String, args) ?? 'tsconfig.json';

const tsConfig: TsConfigJsonResolved & Record<string, unknown> = parseTsconfig(project);
const { compilerOptions = {} } = tsConfig;

const outDir = getFlag('--outDir', String, args) ?? compilerOptions.outDir ?? 'dist';

const packageJson = z.record(z.unknown()).parse(await loadJsonFile('package.json'));

const dualistConfig = z.object({
	exports: z.record(z.string()).default({
		'.': 'index.ts',
	}),
}).parse(tsConfig['ts-dualist'] ?? {});

try {
	for (const type of ['module', 'commonjs']) {
		packageJson.type = type;
		await writeJsonFile('package.json', packageJson, { detectIndent: true });

		const typeDir = path.join(outDir, type);
		const tsBuildInfoFile = path.join(typeDir, '.tsbuildinfo');

		if (args.length) {
			await $`tsc --project ${project} --outDir ${typeDir} --incremental --tsBuildInfoFile ${tsBuildInfoFile} ${args}`;
		} else {
			await $`tsc --project ${project} --outDir ${typeDir} --incremental --tsBuildInfoFile ${tsBuildInfoFile}`;
		}

		await writeJsonFile(path.join(typeDir, 'package.json'), { type });
	}

	const exports: any = packageJson.exports ?? {};
	packageJson.exports = exports;

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
			delete packageJson.types;
			delete packageJson.main;
			packageJson.types = exports['.'].require.types;
			packageJson.main = exports['.'].require.default;
		}
	}
} finally {
	delete packageJson.type;
	await writeJsonFile('package.json', packageJson, { detectIndent: true });
}
