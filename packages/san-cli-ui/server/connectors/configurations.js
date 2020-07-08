/**
 * @file configuration
 *
 * Reference: https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-ui/apollo-server/connectors/configurations.js
 */
const fs = require('fs-extra');
const path = require('path');
const clone = require('clone');
const stringifyJS = require('javascript-stringify');
const plugins = require('./plugins');
const cwd = require('./cwd');
const prompts = require('./prompts');
const {get, set, unset} = require('../utils/object');
const extendJSConfig = require('../utils/extendJSConfig');
const {readPackage} = require('../utils/fileHelper');

const fileTypes = ['js', 'json'];
let current = {};

const list = () => {
    return plugins.getApi(cwd.get()).configurations;
};
const findOne = (id, context) => {
    return list(context).find(c => c.id === id);
};
const findFile = (fileDescriptor, context) => {
    if (fileDescriptor.package) {
        const pkg = readPackage(cwd.get(), context);
        const data = pkg[fileDescriptor.package];
        if (data) {
            return {type: 'package', path: path.join(cwd.get(), 'package.json')};
        }
    }

    for (const type of fileTypes) {
        const files = fileDescriptor[type];
        if (files) {
            for (const file of files) {
                const resolvedFile = path.resolve(cwd.get(), file);
                if (fs.existsSync(resolvedFile)) {
                    return {type, path: resolvedFile};
                }
            }
        }
    }
};

const readFile = (config, fileDescriptor, context) => {
    const file = findFile(fileDescriptor, context);
    let fileData = {};
    if (file) {
        if (file.type === 'package') {
            const pkg = readPackage(cwd.get(), context);
            fileData = pkg[fileDescriptor.package];
        }
        else if (file.type === 'js') {
            fileData = require(file.path);
        }
        else {
            const rawContent = fs.readFileSync(file.path, {encoding: 'utf8'});
            if (file.type === 'json') {
                fileData = JSON.parse(rawContent);
            }
        }
    }
    return {
        file,
        fileData
    };
};
const readData = (config, context) => {
    const data = {};
    config.foundFiles = {};
    if (config.files) {
        for (const fileId in config.files) {
            const fileDescriptor = config.files[fileId];
            const {file, fileData} = readFile(config, fileDescriptor, context);
            config.foundFiles[fileId] = file;
            data[fileId] = fileData;
        }
    }
    return data;
};
const getDefaultFile = (fileDescriptor, context) => {
    const keys = Object.keys(fileDescriptor);
    if (keys.length) {
        for (const key of keys) {
            if (key !== 'package') {
                const file = fileDescriptor[key][0];
                return {
                    type: key,
                    path: path.resolve(cwd.get(), file)
                };
            }
        }
    }
};
const writeFile = (config, fileId, data, changedFields, context) => {
    const fileDescriptor = config.files[fileId];
    let file = findFile(fileDescriptor, context);

    if (!file) {
        file = getDefaultFile(fileDescriptor, context);
    }

    if (!file) {
        return;
    }

    console.log('Config write', config.id, data, changedFields, file.path);
    fs.ensureFileSync(file.path);
    let rawContent;
    if (file.type === 'package') {
        const pkg = readPackage(cwd.get(), context);
        pkg[fileDescriptor.package] = data;
        rawContent = JSON.stringify(pkg, null, 2);
    }
    else {
        if (file.type === 'json') {
            rawContent = JSON.stringify(data, null, 2);
        }
        else if (file.type === 'js') {
            const source = fs.readFileSync(file.path, {encoding: 'utf8'});
            if (!source.trim()) {
                rawContent = `module.exports = ${stringifyJS(data, null, 2)}`;
            }
            else {
                const changedData = changedFields.reduce((obj, field) => {
                    obj[field] = data[field];
                    return obj;
                }, {});
                rawContent = extendJSConfig(changedData, source);
            }
        }
    }
    fs.writeFileSync(file.path, rawContent, {encoding: 'utf8'});
};

function writeData({config, data, changedFields}, context) {
    for (const fileId in data) {
        writeFile(config, fileId, data[fileId], changedFields[fileId], context);
    }
}
const getPromptTabs = async (id, context) => {
    const config = findOne(id, context);
    if (config) {
        const data = readData(config, context);
        console.log('Config read', config.id, data);
        current = {config, data};

        // API
        const onReadData = await config.onRead({
            cwd: cwd.get(),
            data
        });

        let tabs = onReadData.tabs;
        if (!tabs) {
            tabs = [
                {
                    id: '__default',
                    label: 'Default',
                    prompts: onReadData.prompts
                }
            ];
        }
        await prompts.reset();
        for (const tab of tabs) {
            tab.prompts = tab.prompts.map(data => prompts.add({
                ...data,
                tabId: tab.id
            }));
        }
        if (onReadData.answers) {
            await prompts.setAnswers(onReadData.answers);
        }
        await prompts.start();

        plugins.callHook({
            id: 'configRead',
            args: [{
                config,
                data,
                onReadData,
                tabs,
                cwd: cwd.get()
            }],
            file: cwd.get()
        }, context);

        return tabs;
    }
    return [];
};
const save = async (id, context) => {
    const config = findOne(id, context);
    if (config) {
        if (current.config === config) {
            const answers = prompts.getAnswers();
            const data = clone(current.data);
            const changedFields = {};
            const getChangedFields = fileId => changedFields[fileId] || (changedFields[fileId] = []);

            // API
            await config.onWrite({
                prompts: prompts.list(),
                answers,
                data: current.data,
                files: config.foundFiles,
                cwd: cwd.get(),
                api: {
                    assignData: (fileId, newData) => {
                        getChangedFields(fileId).push(...Object.keys(newData));
                        Object.assign(data[fileId], newData);
                    },
                    setData(fileId, newData) {
                        Object.keys(newData).forEach(key => {
                            let field = key;
                            const dotIndex = key.indexOf('.');
                            if (dotIndex !== -1) {
                                field = key.substr(0, dotIndex);
                            }
                            getChangedFields(fileId).push(field);

                            const value = newData[key];
                            if (typeof value === 'undefined') {
                                unset(data[fileId], key);
                            }
                            else {
                                set(data[fileId], key, value);
                            }
                        });
                    },
                    async getAnswer(id, mapper) {
                        const prompt = prompts.findOne(id);
                        if (prompt) {
                            const defaultValue = await prompts.getDefaultValue(prompt);
                            if (defaultValue !== prompt.rawValue) {
                                let value = get(answers, prompt.id);
                                if (mapper) {
                                    value = mapper(value);
                                }
                                return value;
                            }
                        }
                    }
                }
            });

            writeData({config, data, changedFields}, context);

            plugins.callHook({
                id: 'configWrite',
                args: [{
                    config,
                    data,
                    changedFields,
                    cwd: cwd.get()
                }],
                file: cwd.get()
            }, context);

            current = {};
        }
    }
    return config;
};
const cancel = (id, context) => {
    const config = findOne(id, context);
    if (config) {
        current = {};
    }
    return config;
};

module.exports = {
    list,
    findOne,
    getPromptTabs,
    save,
    cancel
};
