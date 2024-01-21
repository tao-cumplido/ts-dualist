import assert from 'node:assert/strict';
import { test } from 'node:test';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('invalid flags', async () => {
		const fixture = await setupFixture({ tsVersion });
		assert.rejects(() => fixture.run`node ${cliPath} --build`);
		assert.rejects(() => fixture.run`node ${cliPath} -b`);
		assert.rejects(() => fixture.run`node ${cliPath} --watch`);
		assert.rejects(() => fixture.run`node ${cliPath} -w`);
		assert.rejects(() => fixture.run`node ${cliPath} --incremental`);
		assert.rejects(() => fixture.run`node ${cliPath} --tsBuildInfoFile`);
		assert.rejects(() => fixture.run`node ${cliPath} --declarationDir`);
		assert.rejects(() => fixture.run`node ${cliPath} --declaration`);
	});

	test('invalid declarationDir option', async () => {
		const fixture = await setupFixture({
			tsVersion,
			tsConfig: () => {
				return {
					config: {
						compilerOptions: {
							declarationDir: '.',
						},
					},
				};
			},
		});

		assert.rejects(() => fixture.run`node ${cliPath}`);
	});

	test('invalid explicit module type', async () => {
		const fixture = await setupFixture({
			tsVersion,
			packageJson: (base) => {
				base.type = 'commonjs';
				return base;
			},
		});

		assert.rejects(() => fixture.run`node ${cliPath}`);
	});
};
