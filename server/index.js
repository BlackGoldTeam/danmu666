const WebSocketServer = require('ws').Server;
const port = require('./config').port;
const WechatService = require('./services/Wechat');
const log4js = require('./helpers/logger');
const logger = log4js.Logger('APP');
const wsServer = new WebSocketServer({ port });

logger.info("Server listening on port:" + port);

wsServer.on('connection', function (ws) {
    logger.debug('a client connect');

    ws.on('message', async function (message) {
        try {
            const data = JSON.parse(message);
            if (data.type === "INIT") {
                logger.info('获取二维码', data);
                ws.danmuId = data.clientId;
                const result = await WechatService.getQrcode(data.clientId);
                if(result){
                    const respMsg = {
                        type: 'qrcode',
                        data: result
                    }
                    ws.send(JSON.stringify(respMsg));                    
                }

            } else {
                logger.info('收到消息', ws.danmuId, message);
                const isSecurity = await WechatService.checkContentSecurity(data.content);
                if(isSecurity){
                    wsServer.clients.forEach(function (client) {
                        if (client.danmuId === data.scene && client.readyState === 1) {
                            client.send(message);
                        }
                    });
                }
            }
        } catch (error) {
            logger.error(error);
        }
    });

    ws.on('close', function () {
        logger.info('ws断开');
    })

    ws.on('error', function (error) {
        ws.close();
        logger.error(error);
    })
});