/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file serve run
 * @author wangyongqing <wangyongqing01@baidu.com>
 */

// 可以通过传入 api 和 options，获得 yarg 的 handler
// 方便 command 插件直接调用 run，得到 hanlder
// 为了扩展，需要增加webpack 和 dev-server 的配置回调
module.exports = function apply(argv, api, projectOptions) {
    const {info, error} = require('san-cli-utils/ttyLogger');
    const mode = argv.mode || process.env.NODE_ENV || 'development';
    info(`Starting ${mode} server...`);

    const devServer = require('san-cli-webpack/serve');
    const getNormalizeWebpackConfig = require('./getNormalizeWebpackConfig');

    const {publicPath} = projectOptions;
    const webpackConfig = getNormalizeWebpackConfig(api, projectOptions, argv);
    devServer({
        webpackConfig,
        publicPath,
        devServerConfig: webpackConfig.devServer
    })
        .then(({isFirstCompile, networkUrl}) => {
            if (isFirstCompile) {
                const {textColor} = require('san-cli-utils/randomColor');
                /* eslint-disable no-console */
                console.log();
                console.log(`  Application is running at: ${textColor(networkUrl)}`);
                console.log('  URL QRCode is: ');
                /* eslint-enable no-console */
                // 打开浏览器地址
                argv.open && require('opener')(networkUrl);

                if (argv.qrcode) {
                    // 显示 terminal 二维码
                    require('qrcode-terminal').generate(
                        networkUrl,
                        {
                            small: true
                        },
                        qrcode => {
                            // eslint-disable-next-line
                            const q = '  ' + qrcode.split('\n').join('\n  ');
                            console.log(q);
                        }
                    );
                }
            }
        })
        .catch(({type, stats, err}) => {
            if (type === 'server') {
                error('Local server start failed！', err);
            } else if (stats && stats.toJson) {
                // // TODO: 这里删掉，调试用的
                // process.stderr.write(
                //     stats.toString({
                //         colors: true,
                //         children: false,
                //         modules: false,
                //         chunkModules: false
                //     })
                // );
            } else {
                error(err);
            }
        });
};
