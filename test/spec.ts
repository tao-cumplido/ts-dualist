import assert from "node:assert";
import path from "node:path";
import { describe, test } from "node:test";

import { type PackageJson } from "type-fest";

import { setupFixture } from "./fixture.js";
import { parameters } from "./parameters.js";

console.log(process.argv);

const cliPath = path.join(process.cwd(), 'dist/cli.mjs');

for (const { tsVersion } of parameters) {
	describe(`TS ${tsVersion}`, () => {
		test('default', async () => {
			const fixture = await setupFixture({ tsVersion });
			await fixture.run`node ${cliPath}`;

			const packageJson: PackageJson = JSON.parse(await fixture.fs.readFile('package.json', 'utf-8'));

			assert.deepEqual(packageJson.exports, {
				'.': {
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
		});
	});
}
