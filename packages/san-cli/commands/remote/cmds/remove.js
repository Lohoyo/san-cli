/**
 * @file remove
 * @author wangyongqing <wangyongqing01@baidu.com>
 */

module.exports = {
    command: 'remove <name>',
    desc: 'Remove a scaffolding address',
    aliases: ['rm'],
    builder: {},
    async handler(argv) {
        const fse = require('fs-extra');
        const inquirer = require('inquirer');
        const readRc = require('../../../lib/readRc');
        const {getGlobalSanRcFilePath} = require('@baidu/san-cli-utils/path');
        const {success} = require('@baidu/san-cli-utils/ttyLogger');
        const {name} = argv;

        // 检测是否存在
        // 全局
        let sanrc = readRc('rc') || {};
        const templateAlias = sanrc.templateAlias;
        if (templateAlias && templateAlias[name]) {
            // ask 替换？

            const answers = await inquirer.prompt([
                {
                    name: 'action',
                    type: 'confirm',
                    message: `Are you sure to remove \`${name}\`?`
                }
            ]);
            if (answers.action === false) {
                process.exit(1);
            }
            sanrc.templateAlias[name] = undefined;
            delete sanrc.templateAlias[name];
            let filepath = getGlobalSanRcFilePath();
            fse.writeJsonSync(filepath, sanrc);

            success(`Remove \`${name}\` success!`);
        }
    }
};