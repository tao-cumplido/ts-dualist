import shigen from '@shigen/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type { import("eslint").Linter.FlatConfig[] } */
export default	[
	{
		files: ['**/*.?(c|m)@(j|t)s'],
		ignores: ['dist/**/*'],
		plugins: {
			stylistic,
			shigen,
		},
		rules: {
			'stylistic/array-bracket-newline': ['error', 'consistent'],
			'stylistic/array-element-newline': ['error', 'consistent'],
			'stylistic/comma-dangle': ['error', 'always-multiline'],
			'stylistic/semi': ['error'],

			'shigen/group-imports': ['error'],
			'shigen/sort-imports': ['error'],
		},
	},
	{
		files: ['**/*.?(c|m)ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: 'tsconfig.json',
			},
		},
	},
];
