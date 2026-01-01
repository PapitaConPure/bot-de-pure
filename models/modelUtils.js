/**
 * @param {String} message 
 * @returns {{ validate: (v: *) => Boolean, message: () => `${message}` }}
 */
function makeStringIdValidator(message) {
    return {
        validate: v => v?.length > 0,
        message: () => message,
    };
}

module.exports = {
	makeStringIdValidator,
};
