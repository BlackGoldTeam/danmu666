/*
 * @Author: Allen Xu
 * @Date: 2018-11-26 16:33:01
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2018-11-26 20:00:52
 * @Description: 简单封装微信请求
 */
const request = require('request');

function WechatRequest(url, options = {}) {
    return new Promise(function (resolve, reject) {
        request({
            url,
            json: true,
            ...options
        }, function (err, response) {
            if (!err && !response.body.errcode) {
                resolve(response.body);
            } else {
                reject(err || response.body);
            }
        })
    });
}

module.exports = WechatRequest;