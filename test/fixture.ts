import type { PackageJson, TsConfigJson } from 'type-fest';
import { createFixture, type DataTree, jsonData, textData } from '@shigen/test/fs';

interface SourceTree {
	[key: string]: Buffer | DataTree;
	'index.ts': Buffer;
}

interface FixtureConfig {
	readonly tsVersion: string;
	readonly tsConfig?: (base: TsConfigJson) => {
		readonly fileName?: string;
		readonly config?: TsConfigJson;
	};
	readonly sourceTree?: (base: SourceTree) => DataTree;
	readonly packageJson?: (base: PackageJson) => PackageJson;
}

export async function setupFixture({
	tsVersion,
	tsConfig = () => ({}),
	sourceTree = (base) => base,
	packageJson  = (base) => base,
}: FixtureConfig): ReturnType<typeof createFixture> {
	const tsConfigBase: TsConfigJson = {
		compilerOptions: {
			rootDir: 'src',
		},
	};

	const { fileName: tsConfigFileName = 'tsconfig.json', config: tsConfigData = tsConfigBase } = tsConfig(tsConfigBase);

	const fixture = await createFixture({
		[tsConfigFileName]: jsonData(tsConfigData),
		'package.json': jsonData<PackageJson>(packageJson({
			name: 'ts-dualist-test-fixture',
			version: '0.0.0',
			dependencies: {
				'typescript': `~${tsVersion}.0`,
			},
		})),
		'src': sourceTree({
			'index.ts': textData('export default null;'),
		}),
	});

	await fixture.run`pnpm install`;

	return fixture;
}
