import { Router, RouterOptions } from 'express';
import { MongooseQueryParser } from 'mongoose-query-parser';

abstract class BaseController {
    public router: Router;
    mongooseQueryParser: MongooseQueryParser;

    constructor(options?: RouterOptions) {
        require('express-async-errors');
        this.mongooseQueryParser = new MongooseQueryParser();
        this.router = Router(options);
        this.setupRoutes();
    }

    protected abstract setupRoutes(): void;
}

export default BaseController;
