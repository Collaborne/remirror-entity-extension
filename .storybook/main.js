/* eslint-disable @typescript-eslint/no-var-requires */
const EslintWebpackPlugin = require('eslint-webpack-plugin');
const path = require('path');
const toPath = filePath => path.join(process.cwd(), filePath);

module.exports = {
	core: {
		builder: 'webpack5',
	},
	stories: ['./stories/**/*.stories.tsx'],
	addons: [
		'@storybook/preset-create-react-app',
		'@storybook/addon-actions',
		'@storybook/addon-docs',
		'@storybook/addon-links',
		'@storybook/addon-controls',
		'@storybook/addon-toolbars',
	],
	webpackFinal: config => {
		return {
			...config,
			performance: {
				hints: false,
			},
			plugins: config.plugins.filter(plugin => {
				// Remove the eslint-webpack-plugin: We already check our code, storybook doesn't need to bother
				// doing it again with potentially different options.
				if (plugin instanceof EslintWebpackPlugin) {
					return false;
				}
				return true;
			}),
			resolve: {
				...config.resolve,
				alias: {
					...config.resolve.alias,
					'@emotion/core': toPath('node_modules/@emotion/react'),
					'emotion-theming': toPath('node_modules/@emotion/react'),
				},
			},
		};
	},
};
