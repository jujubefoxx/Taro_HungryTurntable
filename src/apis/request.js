import Taro from '@tarojs/taro'

const baseURL = 'https://caipu.market.alicloudapi.com';
const appCode = 'e61c205f09f7484581728061e8b8f2af';

function request(method, url, data) {
  let http = baseURL + url;
  return new Promise(function (resolve, reject) {
    Taro.showLoading({
      title: '加载中...',
    }).then(r => {
    })
    Taro.request({
      url: http,
      method: method,
      data: data || '',
      header: {
        // 'content-type': method === 'GET' ? 'application/json' : 'application/x-www-form-urlencoded',
        // 'Accept': 'application/json',
        'Authorization': `APPCODE ${appCode}`,
      },
      success: function (res) {
        Taro.hideLoading();
        const {data} = res;
        const result = data.showapi_res_body
        if (res.statusCode === '200' || parseInt(result.ret_code) === 0) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: function (err) {
        reject(err);
      }
    })
  })
}

export default request;
