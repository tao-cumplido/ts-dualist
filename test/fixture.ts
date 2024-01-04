import type { PackageJson, TsConfigJson } from 'type-fest';
import { createFixture, type DataTree, jsonData, textData } from '@shigen/test/fs';

interface SourceTree {
	[key: string]: Buffer | DataTree;
	'index.ts': Buffer;
}

interface FixtureConfig {
	readonly tsVersion: string;
	readonly tsConfig?: (base: TsConfigJson) => TsConfigJson;
	readonly sourceTree?: (base: SourceTree) => DataTree;
}

export async function setupFixture({
	tsVersion,
	tsConfig = (base) => base,
	sourceTree = (base) => base,
}: FixtureConfig): ReturnType<typeof createFixture> {
	const fixture = await createFixture({
		'package.json': jsonData<PackageJson>({
			name: 'ts-dualist-test-fixture',
			version: '0.0.0',
			dependencies: {
				'typescript': `~${tsVersion}.0`,
			},
		}),
		'tsconfig.json': jsonData(tsConfig({
			compilerOptions: {
				rootDir: 'src',
			},
		})),
		'src': sourceTree({
			'index.ts': textData(`export default null;`),
		}),
	});

	await fixture.run`pnpm install`;

	return fixture;
}
