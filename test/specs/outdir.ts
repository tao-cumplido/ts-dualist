import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PackageJson } from 'type-fest';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('cli flag', async () => {
		const fixture = await setupFixture({ tsVersion });

		await fixture.run`node ${cliPath} --outDir out`;

		const packageJson: PackageJson = JSON.parse(await fixture.fs.readFile('package.json', 'utf-8'));

		assert.deepEqual(packageJson.exports, {
			'.': {
				require: {
					types: './out/commonjs/index.d.ts',
					default: './out/commonjs/index.js',
				},
				import: {
					types: './out/module/index.d.ts',
					default: './out/module/index.js',
				},
			},
		});

		assert.equal(packageJson.main, './out/commonjs/index.js');
		assert.equal(packageJson.types, './out/commonjs/index.d.ts');

		assert(await fixture.exists('out/commonjs/index.js'));
		assert(await fixture.exists('out/module/index.js'));
		assert(await fixture.exists('out/commonjs/.tsbuildinfo'));
		assert(await fixture.exists('out/module/.tsbuildinfo'));
	});

	test('tsconfig compiler options', async () => {
		const fixture = await setupFixture({
			tsVersion,
			tsConfig: (base) => {
				return {
					config: {
						compilerOptions: {
							...base.compilerOptions,
							outDir: 'out',
						},
					},
				};
			},
		});

		await fixture.run`node ${cliPath}`;

		const packageJson: PackageJson = JSON.parse(await fixture.fs.readFile('package.json', 'utf-8'));

		assert.deepEqual(packageJson.exports, {
			'.': {
				require: {
					types: './out/commonjs/index.d.ts',
					default: './out/commonjs/index.js',
				},
				import: {
					types: './out/module/index.d.ts',
					default: './out/module/index.js',
				},
			},
		});

		assert.equal(packageJson.main, './out/commonjs/index.js');
		assert.equal(packageJson.types, './out/commonjs/index.d.ts');

		assert(await fixture.exists('out/commonjs/index.js'));
		assert(await fixture.exists('out/module/index.js'));
		assert(await fixture.exists('out/commonjs/.tsbuildinfo'));
		assert(await fixture.exists('out/module/.tsbuildinfo'));
	});
};
