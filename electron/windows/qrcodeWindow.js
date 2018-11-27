const { BrowserWindow } = require('electron');
const path = require('path');

function createQrcodeWindow() {
    const qrcodeWindow = new BrowserWindow({
        width: 200,
        height: 200,
        transparent: true,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
        center: true,
        skipTaskbar: true,// 是否在任务栏中显示窗口
        autoHideMenuBar: true
    });
    qrcodeWindow.setAlwaysOnTop(true, 'pop-up-menu'); //一定要这样设置 要不然在mac下全屏播放PPT的时候看不到弹幕

    qrcodeWindow.loadURL(`file://${path.resolve(__dirname, '..')}/app/qrcode.html`);

    return qrcodeWindow;
}

module.exports = createQrcodeWindow;