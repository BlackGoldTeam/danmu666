
(function (window, Math, undefined) {

	const loop = Symbol("loop");
	const init = Symbol("init"); 		//初始化
	const requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
	//es6

	function getArrRandomly(arr) {
		var len = arr.length;
		//首先从最大的数开始遍历，之后递减
		for (var i = len - 1; i >= 0; i--) {
			//随机索引值randomIndex是从0-arr.length中随机抽取的
			var randomIndex = Math.floor(Math.random() * (i + 1));
			//下面三句相当于把从数组中随机抽取到的值与当前遍历的值互换位置
			var itemIndex = arr[randomIndex];
			arr[randomIndex] = arr[i];
			arr[i] = itemIndex;
		}
		//每一次的遍历都相当于把从数组中随机抽取（不重复）的一个元素放到数组的最后面（索引顺序为：len-1,len-2,len-3......0）
		return arr;
	}


	//普通弹幕
	class normalDM {
		constructor(cv, opts = {}) {

			this.save = [];
			this.canvas = cv;
			this.ctx = cv.getContext('2d');

			this.width = 0;
			this.height = 0;

			this.rows = []; //存放弹幕的通道数

			this.Tween = new Proxy(new Tween(), {
				get: function (target, key) {
					if (typeof target[key] == "function")
						return target[key].bind(target);
					return target[key];
				}
			}); //Tween时间曲线

			this.leftTime = opts.leftTime || 2000;  //头部、底部静止型弹幕的显示时长
			this.space = opts.space || 10;  		//弹幕的行距
			this.unitHeight = 0; 					//弹幕的高度
			this.rowNum = 0;						//通道行数
			this.direction = opts.direction || "rtol"; //弹幕方向 ，默认从右往左
			this.duration = opts.duration || 9000; //弹幕运动时间
			this.type = opts.type || "quad"; 		//Tween算法种类，默认为quad（二次方）
			this.timing = opts.timing || "linear";	//Tween时间曲线
			this.showAvatar = opts.showAvatar || false;
			this.startIndex = 0;		//循环时的初始下标
			this.looped = false;		//是否已经经历过一次循环

			this.changeStyle(opts);
		}

		//添加弹幕
		add(obj) {
			if (!obj) return;

			//如果已经可以计算文本宽度，则直接进行计算
			if (this.looped)
				this.countWidth([obj]);


			this.save.push(obj);
		}

		//清除所有弹幕
		clear() {
			this.save = [];
			this.startIndex = 0;
		}

		//暂停
		pause() {
			this.paused = true;
		}

		//播放
		run() {
			this.paused = false;
		}

		//清屏
		clearRect() {
			this.ctx.clearRect(0, 0, this.width, this.height);
		}

		//修改类型
		changeTiming(timing, type) {
			this.type = type || "quad";
			this.timing = timing || "linear";
		}

		//修改方向
		changeDirection(direction) {
			this.clear();
			this.direction = direction || "rtol";
		}

		//合并字体
		font() {
			this.globalFont = this.globalStyle +
				" " + this.globalWeight +
				" " + this.globalSize +
				" " + this.globalFamily;
		}

		//改变全局样式
		changeStyle(opts = {}) {

			//文本属性保存
			this.globalSize = opts.fontSize || this.globalSize || "24px";   //字体大小
			this.globalFamily = opts.fontFamily || this.globalFamily || "Microsoft JhengHei"; //字体
			this.globalStyle = opts.fontStyle || this.globalStyle || "normal"; //字体样式
			this.globalWeight = opts.fontWeight || this.globalWeight || "normal"; //字体粗细
			this.globalColor = opts.fontColor || this.globalColor || "#ffffff"; //字体颜色
			this.opacity = opts.opacity || this.opacity || 1; //透明程度

			//表示进行过一次全局样式变化
			this.globalChanged = true;
		}

		//启用全局样式
		initStyle(ctx) {

			this.globalChanged = false;

			//合并font属性
			this.font();

			//更新全局样式
			ctx.font = this.globalFont;
			ctx.textBaseline = "middle";
			ctx.fillStyle = this.globalColor;
			ctx.strokeStyle = "rgba(0,0,0,0.3)";
			ctx.globalAlpha = this.opacity;
		}

		//重置弹幕
		reset(resetIndex = 0) {

			//resetIndex表示想要开始重置的弹幕的下标，系统想重置该值以后的弹幕
			let [items, w, leftTime, i, item] = [this.save, this.width, this.leftTime, resetIndex];

			for (; item = items[i++];) {
				item.x = w;
				item.rowRid = false;
				item.pastTime = 0;
				item.recovery = false;
			}
			this.startIndex = resetIndex;
		}

		//更新canvas size
		getSize() {

			this.width = this.canvas.width;
			this.height = this.canvas.height;

			this.deleteRow();
			this.countRows();

			this.globalChanged = true;
		}

		//消除item的row
		deleteRow() {
			let [items, i, item] = [this.save, 0];
			for (; item = items[i++];) {
				item.row = null;
			}
		}

		//生成通道行
		countRows() {

			//保存临时变量
			let unitHeight = parseInt(this.globalSize) + this.space;
			let rowNum = ((this.height - 20) / unitHeight) >> 0;

			//重置通道
			this.rows = [];

			//重新生成通道
			for (let i = 0; i < rowNum; i++) {
				let obj = {
					idx: i,
					y: unitHeight * i + 20
				};
				this.rows.push(obj);
			}

			this.rows = getArrRandomly(this.rows);

			//更新实例属性
			this.unitHeight = unitHeight;
			this.rowNum = rowNum;
		}

		//获取通道
		getRow(item) {

			//如果该弹幕正在显示中，则返回其现有通道
			if (item.row)
				return item.row;

			//获取新通道
			const row = this.rows.shift();
			//生成临时通道
			const tempRow = this.getRow_slide();
			if (row) {
				item.duration -= (row.idx * 150); //调整速度
			}

			//返回分配的通道
			return row || tempRow;

		}

		getRow_slide() {
			return {
				y: 20 + this.unitHeight * ((Math.random() * this.rowNum) << 0),
				speedChange: true,
				tempItem: true
			};
		}

		//计算宽度
		countWidth(items, ctx = this.ctx) {

			this.looped = true;

			let [cw, i, globalSize, item] = [this.width, 0, parseInt(this.globalSize)];

			for (; item = items[i++];) {
				let w = (ctx.measureText(item.text).width + globalSize + 10) >> 0;
				item.width = w;
				item.height = globalSize;
				//更新初始 x
				item.x = cw;
				item.duration = this.duration; //赋值持续时间
				item.pastTime = 0;
			}

		}

		//更新每个弹幕的单独样式
		updateStyle(item, ctx) {
			ctx.font = this.globalStyle +
				" " + this.globalWeight +
				" " + item.fontSize +
				" " + this.globalFamily;

			ctx.fillStyle = item.color || this.globalColor;
		}

		//循环
		update(w, h, time) {

			let [items, ctx, Tween] = [this.save, this.ctx, this.Tween[this.type]];

			this.globalChanged && this.initStyle(ctx); //初始化全局样式

			!this.looped && this.countWidth(items); //计算文本宽度以及初始化位置（只执行一次）

			if (this.paused) return false; //暂停

			this.refresh(items); //更新初始下标startIndex

			let [i, item] = [this.startIndex];

			ctx.clearRect(0, 0, w, h);
			
			for (; item = items[i++];) {
				let iw = item.width;
				let ds = this.getDiretionSettings(iw, w); //获取不同方向时的设置
				this.step(item, time, ds, Tween, this.timing);
				this.draw(item, ctx);
				this.recovery(item, ds);
			}

		}

		//计算
		step(item, time, ds, Tween, timing) {
			const row = this.getRow(item);
			//如果通道已满，则新弹幕变更速度防止弹幕重叠
			if (row.speedChange) {
				row.speedChange = false;
				item.duration -= ((Math.random() * 5000) >> 0);
			}

			item.pastTime += time;

			//更新参数
			item.leftTime ? item.leftTime -= time : "";
			item.x = Tween(timing, item.pastTime, ds.start, ds.dist, item.duration);
			item.y = item.y || row.y || Math.floor(Math.random() * (this.height - 30)) + 30;
			item.row = row;
		}

		//绘制
		draw(item, ctx) {
			//如果已经显示完成，则不显示
			if (item.recovery || item.hide)
				return false;
			const imgHeight = parseInt(this.globalSize);
			let [text, x, y] = [item.text, item.x, item.y];
			const textX = x + imgHeight + 5;

			ctx.save();

			if(this.showAvatar){
				const img = new Image();
				img.src = item.img || '';
				ctx.drawImage(img, x, y - imgHeight / 2, imgHeight, imgHeight);				
			}

			ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
			ctx.shadowOffsetX = 3;
			ctx.shadowOffsetY = 3;
			ctx.shadowBlur = 8;

			ctx.fillStyle = item.color;
			ctx.fillText(text, textX, y);

			ctx.restore();
		}

		//回收弹幕和通道
		recovery(item, ds) {
			item.recovery = this.recoverySlide(item, ds);
			return false;
		}

		recoverySlide(item, ds) {

			//回收slide类型
			let x = item.x;

			if (!item.rowRid && ds.flag(x) && !item.row.tempItem) {
				this.rows.push(item.row);
				item.rowRid = true; //表明该行已被释放
			}

			if (item.pastTime <= item.duration)
				return false;

			return true;
		}

		//更新下标
		refresh(items) {
			let [i, item] = [this.startIndex];

			for (; item = items[i++];) {
				if (!item.recovery) return false;
				//更新下标并清除row
				this.startIndex = i;
				item.row = null;
			}
		}

		//direction,不同方向的设定
		getDiretionSettings(iw, w) {
			if (this.direction == "ltor")
				return {
					start: -iw, //起点
					dist: iw + w, //位移
					flag: (x) => x >= iw //判断该弹幕是否显示完全
				};
			return {
				start: w,
				dist: -iw - w,
				flag: (x) => x < w - iw
			};
		}
	}

	//Tween运动时间曲线
	class Tween {
		constructor() {

		}

		linear(t, b, c, d) {
			return c * t / d + b;
		}

		quad(type, ...data) {

			let linear = this.linear;

			const trail = {

				linear: linear,

				easeIn: (t, b, c, d) => c * (t /= d) * t + b,

				easeOut: (t, b, c, d) => -c * (t /= d) * (t - 2) + b,

				easeInOut: (t, b, c, d) => {
					if ((t /= d / 2) < 1) return c / 2 * t * t + b;
					return -c / 2 * ((--t) * (t - 2) - 1) + b;
				}

			}

			return !!trail[type] && trail[type](...data);
		}

		cubic(type, ...data) {
			let linear = this.linear;

			const trail = {

				linear: linear,

				easeIn: (t, b, c, d) => c * (t /= d) * t * t + b,

				easeOut: (t, b, c, d) => c * ((t = t / d - 1) * t * t + 1) + b,

				easeInOut: (t, b, c, d) => {
					if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
					return c / 2 * ((t -= 2) * t * t + 2) + b;
				}

			}

			return !!trail[type] && trail[type](...data);
		}

		quart(type, ...data) {
			let linear = this.linear;

			const trail = {

				linear: linear,

				easeIn: (t, b, c, d) => c * (t /= d) * t * t * t + b,

				easeOut: (t, b, c, d) => -c * ((t = t / d - 1) * t * t * t - 1) + b,

				easeInOut: (t, b, c, d) => {
					if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
					return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
				}

			}

			return !!trail[type] && trail[type](...data);
		}

		quint(type, ...data) {
			let linear = this.linear;

			const trail = {

				linear: linear,

				easeIn: (t, b, c, d) => c * (t /= d) * t * t * t * t + b,

				easeOut: (t, b, c, d) => c * ((t = t / d - 1) * t * t * t * t + 1) + b,

				easeInOut: (t, b, c, d) => {
					if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
					return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
				}

			}

			return !!trail[type] && trail[type](...data);
		}
	}

	//main
	class DMer {
		//初始化
		constructor(wrap, opts = {}) {

			if (!wrap) {
				throw new Error("没有设置正确的wrapper");
			}

			//datas
			this.wrapper = wrap;
			this.width = wrap.clientWidth;
			this.height = wrap.clientHeight;
			this.canvas = document.createElement("canvas");
			this.normal = new normalDM(this.canvas, opts);

			this.name = opts.name || "";
			this.fps = 0;

			//status
			this.drawing = opts.auto || false;

			//fn
			this[init]();
			this[loop]();
			if (opts.enableEvent)
				this.initEvent(opts);
		}

		[init]() {
			this.canvas.style.cssText = "position:absolute;z-index:100;top:0px;left:0px;";
			this.setSize();
			this.wrapper.appendChild(this.canvas);
		}

		//loop
		[loop](normal = this.normal, prev = new Date().getTime()) {

			let now = new Date().getTime();

			if (!this.drawing) {
				normal.clearRect();
				return false;
			} else {
				let [w, h, time] = [this.width, this.height, now - prev];
				this.fps = 1000 / time >> 0;
				normal.update(w, h, time);
			}

			requestAnimationFrame(() => { this[loop](normal, now); });
		}

		initEvent(opts) {
			let [el, normal, searching] = [this.canvas, this.normal, false];

			el.onmouseup = function (e) {
				e = e || event;

				if (searching) return false;
				searching = true;

				if (e.button == 2) {
					let [pos, result] = [e.target.getBoundingClientRect(), ""];
					let [x, y, i, items, item] = [e.clientX - pos.left,
					e.clientY - pos.top,
						0, normal.save];
					for (; item = items[i++];) {
						let [ix, iy, w, h] = [item.x, item.y, item.width + 10, item.height];

						if (x < ix || x > ix + w || y < iy - h / 2 || y > iy + h / 2 || item.hide || item.recovery)
							continue;

						result = item;
						break;
					}

					let callback = opts.callback || function () { };

					callback(result);

					searching = false;
				}

			};

			el.oncontextmenu = function (e) {
				e = e || event;
				e.preventDefault();
			};

		}

		// API 

		//添加数据
		inputData(obj = {}) {
			if (typeof obj != "object") {
				return false;
			}
			this.normal.add(obj);
		}

		//清除所有弹幕
		clear() {
			this.normal.clear();
		}

		//重置
		reset(i, j) {
			this.normal.reset(i);
		}

		//暂停
		pause() {
			this.normal.pause();
		}

		//继续
		run() {
			this.normal.run();
		}

		//设置宽高
		setSize(w = this.width, h = this.height) {

			if (!Number.isInteger(w) || w < 0 || !Number.isInteger(h) || h < 0)
				return false;

			this.width = w;
			this.height = h;
			this.canvas.width = w;
			this.canvas.height = h;

			this.normal.getSize();
		}

		//获取宽高
		getSize() {
			return {
				width: this.width,
				height: this.height
			};
		}

		//改变全局样式
		changeStyle(opts = {}) {
			this.normal.changeStyle(opts);
		}

		//添加渐变
		addGradient(type, opts) {
			this.normal.addGradient(type, opts);
		}

		//改变普通弹幕方向
		changeDirection(direction) {
			this.normal.changeDirection(direction);
		}

		//改变动画时间曲线
		changeTiming(timing, type) {
			this.normal.changeTiming(timing, type);
		}

		//启用
		start() {
			if (this.drawing)
				return false;

			this.drawing = true;
			this[loop]();
		}

		//停止
		stop() {
			this.drawing = false;
		}

		//fps
		getFPS() {
			return this.fps;
		}
	}

	let DanMuer = function (wrapper, opts) {
		let proxyDMer = new Proxy(new DMer(wrapper, opts), {
			get: function (target, key) {
				if (typeof target[key] == "function")
					return target[key].bind(target);
				return target[key];
			}
		});

		let DM = proxyDMer;

		return {
			pause: DM.pause, //暂停
			run: DM.run, //继续
			start: DM.start, //运行
			stop: DM.stop,	//停止
			changeStyle: DM.changeStyle, //修改普通弹幕全局样式
			setSize: DM.setSize, //修改宽高
			inputData: DM.inputData, //向普通弹幕插入数据
			clear: DM.clear, //清除所有弹幕
			reset: DM.reset, //重新从某个弹幕开始
			getSize: DM.getSize, //获取宽高,
			timing: DM.changeTiming, //修改timing
			direction: DM.changeDirection, //修改弹幕方向
			getFPS: DM.getFPS //获取fps
		};
	};

	window.DanMuer = DanMuer;


	if (typeof module != 'undefined' && module.exports) {
		module.exports = DanMuer;
	} else if (typeof define == "function" && define.amd) {
		define(function () { return DanMuer; });
	}

})(window, Math);