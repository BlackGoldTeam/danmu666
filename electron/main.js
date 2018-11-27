const electron = require('electron');
const helpers = require('./helpers');
const os = require('os');
const config = require('./config');
const { app, Tray, Menu, nativeImage, ipcMain } = electron;
const path = require('path');
const createMainWindow = require('./windows/mainWindow');
const createQrcodeWindow = require('./windows/qrcodeWindow');
const Websocket = require('./websocket');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

initChromuim();

let mainWindow, qrcodeWindow;

ipcMain.on("destroy", function () {
    mainWindow && mainWindow.hide();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            showMainWindow();
        }
    });

    app.on('ready', function () {
        mainWindow = createMainWindow();
        qrcodeWindow = createQrcodeWindow();
        initSocket();
        initTrayMenu();

        mainWindow.on('closed', function () {
            mainWindow = null
        })

        qrcodeWindow.on('closed', function () {
            qrcodeWindow = null
        })

    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', function () {
        if (mainWindow === null) {
            createMainWindow();
        }
    });
}

function initChromuim() {
    //chromuim设置
    app.commandLine.appendSwitch('enable-gpu-rasterization', true);
    app.commandLine.appendSwitch('enable-native-gpu-memory-buffers', true);
    app.commandLine.appendSwitch('high-dpi-support', true);
    app.commandLine.appendSwitch('device-scale-factor', true);
    app.commandLine.appendSwitch('disable-touch-adjustment', true); //禁用触摸调整
    app.commandLine.appendSwitch('main-frame-resizes-are-orientation-changes', true);
    app.commandLine.appendSwitch('disable-pinch', true); //禁用双指缩放    
}

function initSocket() {
    const socket = new Websocket(config.websocketServerUrl, helpers.getClientId())
    socket.onMessage = function (event) {
        try {
            const received_msg = JSON.parse(event.data);
            if (received_msg.type === 'qrcode') {
                qrcodeWindow.webContents.send('qrcodeBase64', received_msg.data);
            } else {
                mainWindow.webContents.send('new-message', received_msg);
            }
        } catch (error) {
            console.log(error);
        }
    }

    socket.onClose = function (event) {
        socket.connect();
    }

    socket.connect();
}

function initTrayMenu() {
    try {
        let iconPath = path.join(__dirname, 'ico/favicon.ico');
        if (os.type() === "Darwin") {
            iconPath = path.join(__dirname, 'ico/favicon.png');
        }
        const nimage = nativeImage.createFromPath(iconPath);
        const tray = new Tray(nimage);
        tray.setToolTip('弹幕');
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '显示弹幕',
                type: 'radio',
                click: showMainWindow
            },
            {
                label: '关闭弹幕',
                type: 'radio',
                click: hideMainWindow
            },
            {
                type: 'separator'
            },
            {
                label: '显示二维码',
                type: 'radio',
                click: showQrcodeWindow
            },
            {
                label: '隐藏二维码',
                type: 'radio',
                click: hideQrcodeWindow
            },
            {
                type: 'separator'
            },
            {
                label: '退出',
                type: 'normal',
                click: function () {
                    app.quit();
                }
            }
        ]);
        tray.setContextMenu(contextMenu);
        tray.on('click', handleToggleShowMainWindow);
    } catch (error) {
        console.log(error);
    }
}

function showMainWindow() {
    if (mainWindow) {
        mainWindow.webContents.send('visibleChanged', true);
        mainWindow.show();
    }
}

function hideMainWindow() {
    mainWindow && mainWindow.webContents.send('visibleChanged', false);
}

function handleToggleShowMainWindow() {
    if (mainWindow && mainWindow.isVisible()) {
        hideMainWindow();
    } else {
        showMainWindow();
    }
}

function showQrcodeWindow() {
    if (qrcodeWindow) {
        qrcodeWindow.show();
    } else {
        createQrcodeWindow();
    }
}

function hideQrcodeWindow() {
    if (qrcodeWindow) {
        qrcodeWindow.hide();
    }
}