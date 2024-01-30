#!/usr/bin/env node

import path from 'node:path';

import { execa } from 'execa';
import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import { loadJsonFile } from 'load-json-file';
import { getFlag } from 'type-flag';
import { writeJsonFile } from 'write-json-file';
import z from 'zod';

const args = process.argv.slice(2);

if (getFlag('--build,-b,--watch,-w', Boolean)) {
	throw new Error(`Build or watch mode not supported.`);
}

if (typeof getFlag('--incremental', Boolean) === 'boolean' || getFlag('--tsBuildInfoFile', String)) {
	throw new Error(`The '--incremental' and '--tsBuildInfoFile' options may not be used as they are automatically set by ts-dualist.`);
}

if (typeof getFlag('--declaration,-d', Boolean) === 'boolean') {
	throw new Error(`The '--declaration' option may not be used as it is automatically set by ts-dualist.`);
}

const project = getFlag('--project,-p', String, args) ?? 'tsconfig.json';

const tsConfig: TsConfigJsonResolved & Record<string, unknown> = parseTsconfig(project);
const { compilerOptions = {} } = tsConfig;

if (compilerOptions.declarationDir || getFlag('--declarationDir', String)) {
	throw new Error(`The 'declarationDir' option may not be set.`);
}

const outDir = getFlag('--outDir', String, args) ?? compilerOptions.outDir ?? 'dist';
const declarationMap = getFlag('--declarationMap', Boolean, args) ?? compilerOptions.declarationMap ?? getFlag('--sourceMap', Boolean) ?? compilerOptions.sourceMap ?? false;

const packageJson = z.record(z.unknown()).parse(await loadJsonFile('package.json'));

if ('type' in packageJson) {
	throw new Error(`The 'type' field in package.json may not be set.`);
}

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

		await execa(
			'tsc',
			[
				'--project',
				project,
				'--outDir',
				typeDir,
				'--declaration',
				'--declarationMap',
				`${declarationMap}`,
				'--incremental',
				'--tsBuildInfoFile',
				tsBuildInfoFile,
				...args,
			],
		);

		await writeJsonFile(path.join(typeDir, 'package.json'), { type });
	}

	const exports: any = packageJson.exports ?? {};
	packageJson.exports = exports;

	delete packageJson.types;
	delete packageJson.main;

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
} finally {
	delete packageJson.type;
	await writeJsonFile('package.json', packageJson, { detectIndent: true });
}
