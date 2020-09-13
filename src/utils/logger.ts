/* istanbul ignore file */
import { TransformableInfo } from 'logform';
import os from 'os';
import { createLogger, format, LoggerOptions, transports } from 'winston';

export const loggerConfig: LoggerOptions = {
    level: process.env.LOGGER_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format((info: TransformableInfo) => {
            const { error, message, stack = '', ...rest } = info;
            if (error instanceof Error) {
                return {
                    message: `${message}${error.message}`,
                    stack: `${stack}${error.stack}`,
                    ...rest
                };
            }
            return info;
        })(),
        format.printf((info) => `${info.timestamp} ${info.level}: ${info.message} on ${os.hostname()}`)
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error', silent: process.env.NODE_ENV === 'test' }),
        new transports.File({ filename: 'combined.log', silent: process.env.NODE_ENV === 'test' })
    ],
    exceptionHandlers: [new transports.Console()]
};

const logger = createLogger(loggerConfig);

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf((info) => `${info.timestamp} ${info.level}: ${info.message} on ${os.hostname()}`)
            )
        })
    );
}

export default logger;
