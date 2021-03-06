/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file 将 serve 的 getNormalWbpackConfig
 * @author wangyongqing <wangyongqing01@baidu.com>
 */

module.exports = function getNormalizeWebpackConfig(api, projectOptions, argv) {
    const {resolveEntry} = require('san-cli-webpack/utils');
    const isProd = api.isProd();
    // 开始正式的操作
    let webpackConfig = api.getWebpackConfig();
    const entry = argv.entry;
    const devServerArgv = {};
    ['https', 'host', 'port', 'publicUrl'].forEach(item => {
        if (argv[item]) {
            devServerArgv[item] = argv[item];
        }
    });

    webpackConfig = resolveEntry(
        entry,
        api.resolve(entry),
        webpackConfig,
        require.resolve('san-cli-service/template/main.js')
    );
    webpackConfig.devServer = Object.assign(
        {
            hot: !isProd,
            compress: isProd,
            contentBase: projectOptions.outputDir
        },
        webpackConfig.devServer,
        devServerArgv
    );
    return webpackConfig;
};
