import type { Transform } from 'node:stream';
import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

import { code } from '@shigen/code-tag';
import { typeFlag } from 'type-flag';

const { flags } = typeFlag({
	tsVersion: {
		type: [String],
		default: [
			'4.7',
			'4.8',
			'4.9',
			'5.0',
			'5.1',
			'5.2',
			'5.3',
		],
	},
});

const cliPath = path.join(process.cwd(), 'dist/cli.mjs');
const specs = await fs.readdir(new URL('specs', import.meta.url));
const specImportPaths = specs.map((base) => {
	const { name } = path.parse(base);
	return `../test/specs/${name}.ts`;
});

await fs.mkdir('.test', { recursive: true });

for (const tsVersion of flags.tsVersion) {
	await fs.writeFile(
		`.test/${tsVersion}.js`,
		code.js`
			import { describe } from 'node:test';

			describe(${`TS ${tsVersion}`}, async () => {
				for (const specPath of ${specImportPaths}) {
					const { default: spec } = await import(specPath);
					spec(${cliPath}, ${tsVersion});
				}
			});
		`,
	);
}

run({ files: flags.tsVersion.map((tsVersion) => path.resolve(`./.test/${tsVersion}.js`))}).compose(spec as unknown as () => Transform).pipe(process.stdout);
