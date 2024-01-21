import assert from 'node:assert/strict';
import {test} from 'node:test';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('project', async () => {
		const fixture = await setupFixture({
			tsVersion,
			tsConfig: (base) => {
				return {
					fileName: 'project.json',
					config: {
						compilerOptions: {
							...base.compilerOptions,
							declarationMap: true,
						},
					},
				};
			},
		});

		assert(await fixture.exists('project.json'));

		await fixture.run`node ${cliPath} -p project.json`;

		assert(await fixture.exists('dist/commonjs/index.d.ts.map'));
		assert(await fixture.exists('dist/module/index.d.ts.map'));
	});
};
