/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config = {
	// Required for jest-remirror custom jest matchers like `expect(...).toEqualRemirrorDocument(...)`
	setupFilesAfterEnv: ['jest-remirror/environment', '<rootDir>/jest-setup.js'],

	testEnvironment: 'jsdom',

	extensionsToTreatAsEsm: ['.ts', '.tsx'],

	testRegex: '/src/.*\\.spec\\.tsx?$',
	// Support our own projects that create commonjs (e.g. carrot-styles)
	transformIgnorePatterns: ['node_modules/(?!(@collaborne)).*\\.js$'],
};

module.exports = config;
