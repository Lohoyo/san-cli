const lMerge = require('lodash.merge');
const TerserPlugin = require('terser-webpack-plugin');
const {getAssetPath} = require('san-cli-utils/path');
const {terserOptions: defaultTerserOptions} = require('../defaultOptions');

module.exports = (webpackConfig, projectOptions) => {
    const {assetsDir, splitChunks, terserOptions = {}} = projectOptions;
    // 是 modern 模式，但不是 modern 打包，那么 js 加上 legacy
    const isLegacyBundle = parseInt(process.env.SAN_CLI_LEGACY_BUILD, 10) === 1;
    // sourcemap
    const filename = getAssetPath(
        assetsDir,
        `js/[name]${isLegacyBundle ? '-legacy' : ''}${projectOptions.filenameHashing ? '.[contenthash:8]' : ''}.js`
    );
    // 条件判断sourcemap是否开启，san.config.js传入
    let ifSourcemap = false;
    if (projectOptions.sourceMap) {
        ifSourcemap = true;
    }
    webpackConfig
        .mode('production')
        .devtool(
            ifSourcemap
                ? typeof projectOptions.sourceMap === 'string'
                    ? projectOptions.sourceMap
                    : 'source-map'
                : false
        )
        .output.filename(filename)
        .chunkFilename(filename);

    if (splitChunks) {
        webpackConfig.optimization.splitChunks(splitChunks);
    }

    webpackConfig.optimization.minimizer('js').use(
        new TerserPlugin({
            extractComments: false,
            parallel: true,
            terserOptions: lMerge(defaultTerserOptions, terserOptions)
        })
    );
};