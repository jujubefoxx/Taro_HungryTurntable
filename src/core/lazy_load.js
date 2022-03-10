
import Vue from 'vue';
import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';

const requireComponent = require.context('./../components/', true, /[A-Z|a-z]\w+\.(vue|js)$/);

requireComponent.keys()
    .forEach((file) => {
        const filePathArr = file.split('/');
        const fileName = filePathArr[filePathArr.length - 2];
        const componentConfig = requireComponent(file);
        const componentName = upperFirst(
            camelCase(fileName.replace(/\.\w+$/, ''))
        );
        // 全局注册组件
        Vue.component(componentName, componentConfig.default || componentConfig);
    });

