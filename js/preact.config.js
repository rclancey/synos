// ... imports or other code up here ...

// these props are both optional
export default {
  /*
	// you can add preact-cli plugins here
	plugins: [
		// either a function
		// (you'd probably import this because you can use the `webpack` function instead of an inline plugin)
		function () {},
		// strings also work (they get imported by preact-cli), useful for the json config
		'plugin-name',
		// with options
		[
			'plugin-name',
			{
				option: true,
			},
		],
	],
  */
	/**
	 * Function that mutates the original webpack config.
	 * Supports asynchronous changes when a promise is returned (or it's an async function).
	 *
	 * @param {object} config - original webpack config.
	 * @param {object} env - options passed to the CLI.
	 * @param {WebpackConfigHelpers} helpers - object with useful helpers for working with the webpack config.
	 * @param {object} options - this is mainly relevant for plugins (will always be empty in the config), default to an empty object
	 **/
	webpack(config, env, helpers, options) {
		/** you can change the config here **/
    console.log('config = %o', config);
    console.log('env = %o', env);
    const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
    rule.options.plugins.push(require.resolve('styled-jsx/babel'));
    const isEnvProduction = env.production;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': `${config.context}/components`,
      '@context': `${config.context}/context`,
      '@lib': `${config.context}/lib`,
      '@assets': `${config.context}/assets`,
    };
    config.module.rules.unshift({
      test: /\.icon\.svg$/,
      use: ["preact-svg-loader"],
      enforce: 'pre',
    });
    //config.devtool = isEnvProduction ? 'nosources-source-map' : 'eval';
    if (process.env.NODE_ENV === 'production') {
      config.devtool = false;
      config.mode = 'production';
      config.optimization = {
        ...config.optimization,
        minimize: isEnvProduction,
        // Automatically split vendor and commons
        // https://twitter.com/wSokra/status/969633336732905474
        // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          name: false,
        },
        /*
        */
        // Keep the runtime chunk separated to enable long term caching
        // https://twitter.com/wSokra/status/969679223278505985
        //runtimeChunk: true,
      };
    } else {
      const plug = helpers.getPluginsByName(config, 'DefinePlugin')[0];
      if (plug) {
        plug.plugin.definitions['process.env.NODE_ENV'] = '"development"';
      }
      config.devtool = 'source-map';
      config.mode = 'development';
      config.optimization = {};
    }
    console.debug('final config = %o', config);
	},
};
