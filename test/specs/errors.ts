import assert from 'node:assert/strict';
import { test } from 'node:test';

import { setupFixture } from '../fixture.js';

export default (cliPath: string, tsVersion: string) => {
	test('invalid flags', async () => {
		await using fixture = await setupFixture({ tsVersion });
		await assert.rejects(() => fixture.run`node ${cliPath} --build`);
		await assert.rejects(() => fixture.run`node ${cliPath} -b`);
		await assert.rejects(() => fixture.run`node ${cliPath} --watch`);
		await assert.rejects(() => fixture.run`node ${cliPath} -w`);
		await assert.rejects(() => fixture.run`node ${cliPath} --incremental`);
		await assert.rejects(() => fixture.run`node ${cliPath} --tsBuildInfoFile test`);
		await assert.rejects(() => fixture.run`node ${cliPath} --declarationDir test`);
		await assert.rejects(() => fixture.run`node ${cliPath} --declaration`);
	});

	test('invalid declarationDir option', async () => {
		await using fixture = await setupFixture({
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

		await assert.rejects(() => fixture.run`node ${cliPath}`);
	});

	test('invalid explicit module type', async () => {
		await using fixture = await setupFixture({
			tsVersion,
			packageJson: (base) => {
				base.type = 'commonjs';
				return base;
			},
		});

		await assert.rejects(() => fixture.run`node ${cliPath}`);
	});
};
