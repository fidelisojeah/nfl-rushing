import { RouteNotFoundException } from '../core/exceptions';
import { NextFunction, Request, Response } from 'express';

function notFound(request: Request, _response: Response, next: NextFunction): void {
    next(new RouteNotFoundException(request));
}

export default notFound;
