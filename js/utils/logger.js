export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor() {
        this.level = LogLevel.INFO;
    }

    setLevel(level) {
        this.level = level;
    }

    debug(message, ...args) {
        if (this.level <= LogLevel.DEBUG) console.debug(`[DEBUG] ${message}`, ...args);
    }

    info(message, ...args) {
        if (this.level <= LogLevel.INFO) console.info(`[INFO] ${message}`, ...args);
    }

    warn(message, ...args) {
        if (this.level <= LogLevel.WARN) console.warn(`[WARN] ${message}`, ...args);
    }

    error(message, ...args) {
        if (this.level <= LogLevel.ERROR) console.error(`[ERROR] ${message}`, ...args);
    }
}

export const logger = new Logger();
