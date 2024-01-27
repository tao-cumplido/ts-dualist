import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PackageJson } from 'type-fest';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('entry points', async () => {
		const fixture = await setupFixture({
			tsVersion,
			tsConfig: (base) => {
				return {
					config: {
						...base,
						'ts-dualist': {
							exports: {
								test: 'index.ts',
							},
						},
					},
				};
			},
		});

		await fixture.run`node ${cliPath}`;

		const packageJson: PackageJson = JSON.parse(await fixture.fs.readFile('package.json', 'utf-8'));

		assert.deepEqual(packageJson.exports, {
			'test': {
				require: {
					types: './dist/commonjs/index.d.ts',
					default: './dist/commonjs/index.js',
				},
				import: {
					types: './dist/module/index.d.ts',
					default: './dist/module/index.js',
				},
			},
		});

		assert.equal(packageJson.main, undefined);
		assert.equal(packageJson.types, undefined);

		assert(await fixture.exists('dist/commonjs/index.js'));
		assert(await fixture.exists('dist/module/index.js'));
		assert(await fixture.exists('dist/commonjs/.tsbuildinfo'));
		assert(await fixture.exists('dist/module/.tsbuildinfo'));
	});
};
