import assert from 'node:assert/strict';
import {test} from 'node:test';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('tsconfig', async () => {
		await using fixture = await setupFixture({
			tsVersion,
			tsConfig: (base) => {
				return {
					fileName: 'project.json',
					config: {
						compilerOptions: {
							...base.compilerOptions,
							outDir: 'out',
						},
					},
				};
			},
		});

		assert(await fixture.exists('project.json'));

		await fixture.run`node ${cliPath} -p project.json`;

		assert(await fixture.exists('out/commonjs/index.js'));
		assert(await fixture.exists('out/module/index.js'));
	});

	test('sourcemap', async () => {
		await using fixture = await setupFixture({ tsVersion });

		await fixture.run`node ${cliPath} --sourceMap`;

		assert(await fixture.exists('dist/commonjs/index.js.map'));
		assert(await fixture.exists('dist/commonjs/index.d.ts.map'));
	});
};
