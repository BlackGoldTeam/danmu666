(function () {

	const ipcRenderer = require('electron').ipcRenderer;
	const wrapper = document.querySelector("#full-page");
	let DMer = null;
	let messages = [];
	let timer = null;
	
	ipcRenderer.on('visibleChanged', (event, visible) => {
		if (visible) {
			init();
		} else {
			destroy();
		}
	});

    ipcRenderer.on('new-message', function (event, data) {
		messages.push(data);
    });

	function destroy() {
		timer && clearInterval(timer);
		DMer && DMer.stop();
		wrapper.removeChild(document.querySelector("canvas"));
		ipcRenderer.send("destroy");
	}

	function getRandomColor() {
		const colors = ['#E2DBBE', '#A3A380', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FFC09F', '#7878A8'];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	function init() {
		messages = [];
		DMer = DanMuer(wrapper, {
			fontFamily: "Microsoft YaHei",
			fontSize: "48px",
			showAvatar: false
		});
		DMer.setSize(window.screen.availWidth, window.screen.availHeight);
		DMer.start();

		timer && clearInterval(timer);
		timer = setInterval(function () {
			const msg = messages.shift();
			if (msg && msg.content) {
				DMer.inputData({
					img: msg.avatarUrl,
					text: msg.content,
					color: getRandomColor()
				});
			}
		}, 60);
	}

	init();

}())

