/*
 * @Author: Allen Xu
 * @Date: 2018-11-17 09:46:24
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2018-11-26 20:01:16
 * @Description: 微信API集合
 */
const config = require('../config');
const wechatMiniProgram = config.wechatMiniProgram;
const log4js = require('../helpers/logger');
const request = require('../helpers/request');
const logger = log4js.Logger('WECHAT');
const [appid, secret] = [wechatMiniProgram.appid, wechatMiniProgram.secret];
let WechatAccessTokenObj = null;

async function getAccessToken() {
    try {
        const result = await request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`);
        const accessToken = result.access_token;
        WechatAccessTokenObj = {
            accessToken,
            expiresIn: result.expires_in,
            time: new Date().getTime()
        }
        logger.info('从微信服务器获取微信access_token成功', WechatAccessTokenObj);
        return accessToken;
    } catch (error) {
        logger.error('获取微信access_token报错', error);
    }
}

async function getQrcode(sceneId, token) {
    try {
        const result = await request(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`, {
            method: 'POST',
            encoding: null,
            body: {
                page: "pages/index/index",
                scene: sceneId,
                width: 300
            }
        });
        logger.info('获取小程序二维码成功');
        const prefix = "data:image/jpeg;base64,";
        const base64 = prefix + result.toString('base64');
        return base64;
    } catch (error) {
        logger.error('获取小程序二维码失败', error);
    }
}

async function checkContentSecurity(content, token) {
    try {
        const result = await request(`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${token}`, {
            method: 'POST',
            body: {
                content
            }
        });
        return true;
    } catch (error) {
        logger.error('内容安全校验不通过:', content);
    }
}

const Wechat = {
    getAccessToken: async function () {
        if (WechatAccessTokenObj && ((new Date().getTime() - WechatAccessTokenObj.time) < WechatAccessTokenObj.expiresIn * 1000)) {
            logger.info('从内存获取微信access_token成功');
            logger.info(WechatAccessTokenObj);
            return WechatAccessTokenObj.accessToken;
        } else {
            const token = await getAccessToken();
            return token;
        }
    },
    getQrcode: async function (sceneId) {
        const token = await getAccessToken();
        const qrcode = await getQrcode(sceneId, token);
        return qrcode;
    },

    checkContentSecurity: async function (content) {
        if (config.checkContentSecurity) {
            const token = await getAccessToken();
            const isSecurity = await checkContentSecurity(content, token);
            return isSecurity;
        } else {
            return true;
        }
    }
}
module.exports = Wechat;