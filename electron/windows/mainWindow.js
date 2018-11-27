const { BrowserWindow } = require('electron');
const path = require('path');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        transparent: true,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        center: true,
        skipTaskbar: true, // 是否在任务栏中显示窗口
        autoHideMenuBar: true,
        focusable: false
    });
    mainWindow.setAlwaysOnTop(true, 'pop-up-menu'); //一定要这样设置 要不然在mac下全屏播放PPT的时候看不到弹幕

    mainWindow.maximize();
    mainWindow.setIgnoreMouseEvents(true); //点击穿透
    mainWindow.loadURL(`file://${path.resolve(__dirname, '..')}/app/index.html`);

    return mainWindow;

}

module.exports = createMainWindow;