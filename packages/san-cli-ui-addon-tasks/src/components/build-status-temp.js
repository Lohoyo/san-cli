/**
 * @file 任务仪表盘中的编译状态模块
 * @author Lohoyo
 */

import {Component} from 'san';
import './build-status-temp.less';
import {Grid} from 'santd';
import 'santd/es/grid/style';

export default class BuildStatus extends Component {
    static template = /* html */`
    <div class="build-status">
        <s-row gutter="16" class="first-row">
            <s-col span="8" class="info-block">
                <div class="label">状态</div>
                <div class="value">{{buildStatus.status}}</div>
            </s-col>
            <s-col span="8" class="info-block">
                <div class="label">错误</div>
                <div class="value">{{buildStatus.errors}}</div>
            </s-col>
            <s-col span="8" class="info-block">
                <div class="label">警告</div>
                <div class="value">{{buildStatus.warnings}}</div>
            </s-col>
        </s-row>
        <s-row gutter="16">
            <s-col span="8" class="info-block">
                <div class="label">资源</div>
                <div class="value">{{buildStatus.assets}}</div>
                <!-- <div class="extra-info">(Parsed)</div> -->
            </s-col>
            <s-col span="8" class="info-block">
                <div class="label">模块</div>
                <div class="value">{{buildStatus.modules}}</div>
                <!-- <div class="extra-info">(Parsed)</div> -->
            </s-col>
            <s-col span="8" class="info-block">
                <div class="label">依赖项</div>
                <div class="value">{{buildStatus.deps}}</div>
                <!-- <div class="extra-info">92.78%</div> -->
            </s-col>
        </s-row>
    </div>
    `;

    static components = {
        's-col': Grid.Col,
        's-row': Grid.Row
    };
};
