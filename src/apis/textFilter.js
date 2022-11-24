import Taro from "@tarojs/taro";

const AK = "sQ4alA6B3P478sSTtx9tWy2t";
const SK = "f4jXAevC2B6tT9R4qDfuGMGal4C4pVrU";
const baseURL = "https://aip.baidubce.com";

async function textFilter(text) {
  const options = {
    method: "POST",
    url:
      baseURL +
      "/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=" +
      (await getAccessToken()),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    data: "text=" + text,
  };
  await Taro.showLoading({
    title: "处理中...",
  });
  return new Promise((resolve, reject) => {
    Taro.request({
      ...options,
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
function getAccessToken() {
  let options = {
    method: "POST",
    url:
      baseURL +
      "/oauth/2.0/token?grant_type=client_credentials&client_id=" +
      AK +
      "&client_secret=" +
      SK,
  };
  return new Promise((resolve, reject) => {
    Taro.request({
      ...options,
      success: function (res) {
        resolve(res.data.access_token);
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

export default textFilter;
