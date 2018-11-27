//index.js
//获取应用实例
import localStorage from '../../utils/storage.js';
const app = getApp();

Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        content: '',
        scanWXACode: true
    },
    scene: ' ',
    lastTapTime: 0, //最后一次点击事件发生的时间
    timer: null,
    //事件处理函数
    bindViewTap: function() {
        wx.navigateTo({
            url: '../logs/logs'
        });
    },
    onLoad: function(query = {}) {
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            });
        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                });
            };
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo;
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    });
                }
            });
        }

        if(query.scene) {
            //扫码进入
            this.scene = decodeURIComponent(query.scene);
            localStorage.set('scene', this.scene);
        } else {
            //非扫码进入
            localStorage.get('scene').then((scene) => {
                this.scene = scene;
            }).catch(() => {
                this.setData({
                    scanWXACode: false
                })
            })
        }
    },
    getUserInfo: function(e) {
        const { errMsg } = e.detail;
        if (errMsg === 'getUserInfo:ok') {
            app.globalData.userInfo = e.detail.userInfo;
            this.setData({
                userInfo: e.detail.userInfo,
                hasUserInfo: true
            });
        }
        
    },
    formSubmit: function(e) {
        const content = e.detail.value.content.trim();
        const { userInfo } = this.data;
        var data = {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            content: content,
            scene: this.scene
        }

        //当前时间
        const currentTime = e.timeStamp;
        //上一次的点击事件发生的时间
        const lastTapTime = this.lastTapTime;
        //更新上一次的点击时间
        this.lastTapTime = e.timeStamp;

        if(currentTime - lastTapTime < 300 && !content) {
            //双击事件
            data.content = '666';
            this.sendBulletScreen(data, 'double');
            this.setData({
                doubleClick: true
            });
            
            clearTimeout(this.timer);
        } else {
           
            //单击事件
            if (!content) {
                return ;
            }
            this.timer = setTimeout(() => {
                this.sendBulletScreen(data);
            }, 300);
        }
        
    },
    //发送弹幕
    sendBulletScreen: function(data, double) {
        const vm = this;
        wx.sendSocketMessage({
            data: JSON.stringify(data),
            success: function() {
                console.log('弹幕消息发送成功');
                wx.showToast({
                    title: double === 'double' ? '双击666' : '发送成功'
                })
                vm.setData({
                    content: ''
                })
            },
            fail: function() {
                console.log('弹幕消息发送失败');
                wx.showToast({
                    title: '发送失败',
                    icon: 'none'
                })
            }
        })
    }
    
});
