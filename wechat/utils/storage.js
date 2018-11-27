/**
 * 本地缓存组件
 * 同一个微信用户，同一个小程序上限为 10MB 
 * 调用方法: 
 * 获取指定值 localStorage.get(key).then((res) => {});
 * 设置指定值 localStorage.set(key, keyvalue, 过期时间);
 * @author chenpeidan
 */
import promisify from './promisify.js';

function now () {
	return +new Date();
}

//白名单里的不做清理
const WHITE_LIST = [
	'cookies'
];

/**
 * 将过期时间字符串转换成时间戳
 *
 * @param  {String} val  过期时间，格式为`\d+[smhd]`，其中s 表示秒、m 分钟、h 小时、d 天，如 30d
 * @return {Number}      时间戳（单位ms）
 */
function convertExpire (val) {
	if (!val) {
		return 0;
	}

	const matches = ('' + val).match(/(\d+)([smhd])/);
	let ms = 0;

	if (matches) {
		switch (matches[2]) {
			case 's':
				ms = matches[1] * 1000;
				break;
			case 'm':
				ms = matches[1] * 60 * 1000;
				break;
			case 'h':
				ms = matches[1] * 60 * 60 * 1000;
				break;
			case 'd':
				ms = matches[1] * 24 * 60 * 60 * 1000;
			default:
		}
		return now() + ms;
	} else {
		return 0;
	}
}

const storage = {
	/**
     * 将数据写入本地缓存
     *
     * @param  {String}          key      键名
     * @param  {Object | String} value    数据
     * @param  {Object}          options  可选项，可传expire设定数据过期时间，格式参见convertExpire
     *
     * @return {Promise}         Promise实例
     */
	set (key, value, options = {}) {
		return new Promise((resolve, reject) => {
			const { expire } = options;

			const data = {
				_expire: convertExpire(expire || '7d'),
				_data: value
			};

			if (WHITE_LIST.findIndex((x) => x === key) !== -1) {
				data._expire = 9876543210 * 1000;
			}
			promisify(wx.setStorage)({
				key,
				data
			})
				.then(res => {
					resolve(res);
				})
				.catch(err => {
					reject(err);
				});
		});
	},

	/**
     * 获取本地缓存数据，当数据已过期时会被清理掉
     *
     * @param  {String}  key         键名
     * @param  {Mix}     defaultVal  如设置了默认值，则保证不会被reject
     * 
     * @return {Promise}      Promise实例
     */
	get (key, defaultVal) {
		return new Promise((resolve, reject) => {

			promisify(wx.getStorage)({key})
				.then(res => {
					const { _expire, _data } = res.data;
			
					//缓存未过期
					if (_expire > now()) {
						resolve(_data);
					} else {
						//缓存过期
						wx.removeStorage({
							key,
							success: () => {},
							complete: () => {
								if (typeof defaultVal !== 'undefined') {
									resolve(defaultVal);
								} else {
									reject({ errMsg: 'Storage data expired :(' });
								}
							}
						});
					}
				})
				.catch(err => {
					if (typeof defaultVal !== 'undefined') {
						resolve(defaultVal);
					} else {
						reject(err);
					}
				});
		});
	},

	/**
     * 移除本地缓存数据
     */
	remove (key) {
		return new Promise((resolve, reject) => {

			promisify(wx.removeStorage)({key}).then(res => {
				resolve(res);
			}).catch(err => {
				reject(err);
			})
		});
	},
	/**
     * 如检查到本地缓存数据量快超出限制，将其全部清空，仅放在APP onLaunch 时执行
     */
	checkAndClearAllIfNeeded () {

		promisify(wx.getStorageInfo)()
			.then(res => {
				if (res.currentSize > res.limitSize * 0.9) {
					wx.clearStorage();
					console.warn('清空本地缓存以防止溢出！', res.currentSize);
				}
			});
	},

	/**
     * 将过期的本地缓存数据清除掉，建议只放在App onHide 中执行
     */
	checkAndClearExpired () {

		promisify(wx.getStorageInfo)()
			.then(res => {
				if (!res.keys || typeof res.keys.forEach !== 'function') {
					return;
				} //避免某些诡异的报错

				res.keys.forEach((key) => {
					this.get(key); //获取时会自动清理过期的
				});
			});
	}
};

module.exports = storage;
