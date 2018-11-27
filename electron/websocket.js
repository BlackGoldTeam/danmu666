const ws = require('ws');

class Websocket {
    constructor(url, clientId){
        this.url = url;
        this.clientId = clientId;
        this.connect = this.connect.bind(this);
    }

    onMessage(){}
    onClose(){}

    connect(){
        const Socket = new ws(this.url);

        Socket.onopen = () => {
            console.log("Socket.onopen", this.clientId);
            const initData = {
                type: 'INIT',
                clientId: this.clientId
            }
            Socket.send(JSON.stringify(initData));
        };

        Socket.onmessage = this.onMessage;

        Socket.onclose = this.onClose;

        Socket.onerror = (error) => {
            console.log('Socket.onerror');
            console.log(error);
        };
    }
}

module.exports = Websocket;
