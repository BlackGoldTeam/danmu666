/*
 * @Author: Allen Xu
 * @Date: 2018-11-17 10:23:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2018-11-26 20:02:04
 * @Description: 简单封装log4js
 */


var log4js = require('log4js');
var util = require('util');
var path = require('path');
var config = require('../config');
var _ = require('lodash');
var fs = require('fs');

var logsLevel = config.logsLevel;
var appPath = fs.realpathSync(process.cwd());

var LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

/* -------- 日志级别 ------- */
var logsLevelIndex = _.indexOf(LEVELS, logsLevel);
/* -------- 日志级别END ------- */


var logsPath = path.join(appPath, 'logs');

var LAYOUT =  {
    type    : 'pattern',
    pattern : '[%p %d %x{info} ] %x{ln}',
    tokens: {
        ln : function(event) {
        	return (event.data[1] ? event.data[1].replace(/\\n/g, '\n') : '')
        },
        info: function(event) {
        	return event.data[0];
        }
    }
}

var getAppenders = function(){
	//日志配置项
	var APPENDERS = {
		console: {
			type: 'console'
		},
		error: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_error.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		},
		debug: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_debug.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		},
		warn: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_warn.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		},
		info: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_info.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		},
		time: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_debug.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		},
		fatal: {
			type: 'dateFile',
			filename: path.join(logsPath, 'log_fatal.log'),
			absolute: true,
			alwaysIncludePattern: false,
			layout: LAYOUT
		}
	};
	return APPENDERS;
}


//日志对象
var Logger = function(ClassName) {
	var timer = {}; //时间计时器
	var loggers = {}; //分类的日志容器

	//初始化日志信息
	log4js.configure({
		appenders: getAppenders(),
		replaceConsole: true,
		categories: {
			default: {
				appenders: ['debug'], level: 'debug'
			},
			// trace: {
			// 	appenders: ['console'], level: 'trace'
			// },
			debug: {
				appenders: ['debug', 'console'], level: 'debug'
			},
			info: {
				appenders: ['debug', 'info', 'console'], level: 'info'
			},
			warn: {
				appenders: ['debug', 'info', 'warn', 'console'], level: 'warn'
			},
			error: {
				appenders: ['debug', 'info', 'error', 'warn', 'console'], level: 'error'
			},
			fatal: {
				appenders: ['debug', 'info', 'error', 'warn', 'fatal', 'console'], level: 'fatal'
			}
		}
	});

	//内部函数
	var fn = {
		/**
		 * 获取不同等级的日志操作对象
		 * @param level 日志等级
		 * @returns {*}
		 */
		getLogger: function(level) {
			if (loggers[level] != undefined) {
				return loggers[level];
			}
			var logger = log4js.getLogger(level);
			loggers[level] = logger;
			return logger;
		},
		/**
		 * 写入
		 * @param className
		 * @param level
		 * @param args
		 */
		write: function(className, level, args) {
			if (_.indexOf(LEVELS, level) >= logsLevelIndex) { //当且仅当大于设置的日志级别才打印日志
				var logger = fn.getLogger(level);
				var sArgs = [];
				for (var key in args) {
					typeof args[key] === 'string' ? sArgs.push(args[key]) :
						sArgs.push(util.inspect(args[key]));
				}
				sArgs = sArgs.join(' | ');
				logger[level](className, sArgs);
			}
		}
	};
	var api = {
		debug: function() {
			fn.write(ClassName, 'debug', arguments);
		},
		error: function() {
			fn.write(ClassName, 'error', arguments);
		},
		info: function() {
			fn.write(ClassName, 'info', arguments);
		},
		warn: function() {
			fn.write(ClassName, 'warn', arguments);
		},
		fatal: function() {
			fn.write(ClassName, 'fatal', arguments);
		},
		time: function(timeName) {
			timer[timeName] = new Date().getTime();
		},
		timeEnd: function(timeName) {
			api.property((new Date().getTime() - timer[timeName]) + 'ms : ' + timeName);
			timer[timeName] = undefined;
		}
	};
	return api;
};

exports.Logger = Logger;