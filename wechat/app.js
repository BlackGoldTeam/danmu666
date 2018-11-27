import config from './config';
//app.js
App({
    onLaunch: function() {
        // 展示本地存储能力
        var logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);

        // 登录
        wx.login({
            success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            }
        });
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            this.globalData.userInfo = res.userInfo;

                            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                            // 所以此处加入 callback 以防止这种情况
                            if (this.userInfoReadyCallback) {
                                this.userInfoReadyCallback(res);
                            }
                        }
                    });
                }
            }
        });
    },
    onShow: function() {
        this.socketConnect();
        const vm = this;
        wx.onSocketClose(function() {
            vm.socketConnect();
        });
        wx.onSocketError(function() {
            vm.socketConnect();
        })

        //监听websocket接收到服务器的消息事件
        wx.onSocketMessage(function(res) {
            console.log('res',res);

        })
    },
    globalData: {
        userInfo: null
    },
    socketConnect: function() {
        //建立一个socket连接
        wx.connectSocket({
            url: config.websocketServerUrl,
            header:{
              'content-type': 'application/json'
            },
            protocols: ['protocol1'],
            success: function() {
                console.log('成功创建一个socket连接');
            }
        });
    }
});
