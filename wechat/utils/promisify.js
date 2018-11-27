
//把wx异步函数转成promise

const promisify = original => {
    return function(opt) {
        return new Promise((resolve, reject) => {
            opt = Object.assign(
                {
                    success: resolve,
                    fail: reject
                },
                opt
            );
            original(opt);
        });
    };
};

module.exports = promisify;