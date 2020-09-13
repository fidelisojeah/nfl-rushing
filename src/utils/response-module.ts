import { NextFunction, Request, Response } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

/**
 * @description responseModule middleware injects a response object to the api
 * @param _
 * @param {Response} response
 * @param {NextFunction} next
 */
export function responseModule(_: Request, response: Response, next: NextFunction): void {
    response.responseModule = ({ message, data, status = StatusCodes.OK, meta }, serializer?) => {
        const responseMessage = message || getReasonPhrase(status);
        response.status(status);
        let transformerData = data;

        if (serializer) {
            if (Array.isArray(data)) {
                transformerData = data.map((d) => serializer.serializeOutput(d));
            } else {
                transformerData = serializer.serializeOutput(data);
            }
        }

        response.send({
            VERSION: response.locals.version || 'V1',
            statusCode: status,
            message: responseMessage,
            data: transformerData,
            meta
        });
    };
    next();
}

export default responseModule;
