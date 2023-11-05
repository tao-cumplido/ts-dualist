#!/usr/bin/env node

import path from 'node:path';

import { $ } from 'execa';
import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import { loadJsonFile } from 'load-json-file';
import { writeJsonFile } from 'write-json-file';
import z from 'zod';

const args = process.argv.slice(2);

if (args.find((value) => value === '--build' || value === '-b')) {
	throw new Error(`Build mode not supported.`);
}

const projectIndex = args.findIndex((value) => value === '--project' || value === '-p');
const project = args[projectIndex + 1] ?? 'tsconfig.json';

if (project.startsWith('-') || project === args[0]) {
	throw new Error(`invalid --project value`);
}

if (projectIndex >= 0) {
	args.splice(projectIndex, 2);
}

const tsConfig: TsConfigJsonResolved & Record<string, unknown> = parseTsconfig(project);
const packageJson = z.record(z.unknown()).parse(await loadJsonFile('package.json'));

const dualistConfig = z.object({
	exports: z.record(z.string()).default({
		'.': 'index.ts',
	}),
}).parse(tsConfig['ts-dualist'] ?? {});

const { compilerOptions = {} } = tsConfig;

const { outDir = 'dist' } = compilerOptions;

try {
	for (const type of ['module', 'commonjs']) {
		packageJson.type = type;
		await writeJsonFile('package.json', packageJson, { detectIndent: true });

		if (args.length) {
			await $`tsc --project ${project} --outDir ${path.join(outDir, type)} ${args}`;
		} else {
			await $`tsc --project ${project} --outDir ${path.join(outDir, type)}`;
		}

		await writeJsonFile(path.join(outDir, type, 'package.json'), { type });
	}

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
} finally {
	delete packageJson.type;
	await writeJsonFile('package.json', packageJson, { detectIndent: true });
}
