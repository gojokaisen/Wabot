
const createProtectedCommand = (commandDetails) => {
    const authorSymbol = Symbol('author');
    
    const command = {
        [authorSymbol]: 'Frank Kaumba',
        get author() {
            return this[authorSymbol];
        }
    };

    
    Object.entries(commandDetails).forEach(([key, value]) => {
        if (key !== 'author') {
            Object.defineProperty(command, key, {
                value,
                writable: false,
                configurable: false
            });
        }
    });

    
    Object.preventExtensions(command);

    
    return Object.freeze(command);
};

module.exports = createProtectedCommand;
