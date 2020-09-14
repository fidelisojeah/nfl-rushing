import 'express-serve-static-core';
import { Serializer } from '../interfaces/Serializer';

interface IResponse {
    message?: string;
    data?: any;
    meta?: {
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        [key:string]: string | number | null;
    };
    status?: any;
}

declare module 'express-serve-static-core' {
    interface Response {
        responseModule: ({ message, data, status, meta }: IResponse, serializer?: Serializer) => void;
    }
}
