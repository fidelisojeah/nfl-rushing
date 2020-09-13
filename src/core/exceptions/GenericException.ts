import { StatusCodes } from 'http-status-codes';

interface IFromatError {
    data?: Record<string, unknown>;
    name: string;
    message: string;
    statusCode: number;
}

export default class GenericException extends Error {
    public name = 'GenericException';
    protected statusCode = 501;
    protected httpCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
    protected data?: Record<string, unknown>;

    constructor(params: { message: string; data?: Record<string, unknown>; statusCode?: number; name: string }) {
        super(params.message);

        this.name = params.name;
        this.data = params.data;
        this.statusCode = params.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        this.httpCode = this.statusCode;
        Object.setPrototypeOf(this, GenericException.prototype);
    }

    public formatError(): IFromatError {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            ...(this.data && { data: this.data })
        };
    }
}
