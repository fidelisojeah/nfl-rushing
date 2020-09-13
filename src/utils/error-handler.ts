import { GenericException } from '../core/exceptions';
import { ValidationErrorResult } from '../interfaces/ValidationErrorResult';
import * as express from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import mongoose from 'mongoose';

import logger from './logger';

const errorHandler = (
    error: Error,
    _: express.Request,
    response: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
): express.Response => {
    let errorData = {
        VERSION: response.locals.version || 'V1',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        name: 'UnhandledException',
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        data: {},
        ...(process.env.NODE_ENV !== 'production' && { error })
    };

    if (error instanceof GenericException) {
        errorData = { ...errorData, ...error.formatError() };
    }

    if (error instanceof mongoose.Error.CastError) {
        const data = {
            [error.path]: error.message
        };
        errorData = {
            ...errorData,
            name: 'CastError',
            statusCode: StatusCodes.BAD_REQUEST,
            message: error.message,
            data
        };
    }

    if (error instanceof mongoose.Error.ValidationError) {
        const data = Object.keys(error.errors).reduce((result: ValidationErrorResult, val: string) => {
            const value = val === 'userId' ? 'global' : val;
            if (!Object.prototype.hasOwnProperty.call(result, value)) {
                result[value] = [];
            }

            result[value].push(error.errors[value].message.replace('Path ', '').trim());
            return result;
        }, {});

        errorData = {
            ...errorData,
            name: 'ValidationError',
            statusCode: StatusCodes.BAD_REQUEST,
            message: error.message,
            data
        };
    }

    logger.error(error);

    return response.status(errorData.statusCode).send({
        ...errorData
    });
};

export default errorHandler;
