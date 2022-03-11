import request from './request';


const getMenuType = () => request('GET', '/showapi_cpType');
const getMenuList = (params) => request('GET', '/showapi_cpQuery',params);

export {
  getMenuType,getMenuList
};
