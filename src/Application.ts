import { errorHandler, logger, notFound, responseModule } from './utils';
import { LogEntry } from 'winston';
import compression from 'compression';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import http, { Server } from 'http';
import morgan from 'morgan';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';

import './utils/load-envs';
import { RecordsController } from './controllers';

export class Application {
    private startHandlers: (() => unknown)[] = [];
    private shutdownHandlers: (() => unknown)[] = [];
    public database?: mongoose.Connection;
    public server?: Server;

    public app: express.Application = express();

    public onStart(handler: () => unknown): void {
        this.startHandlers.push(handler);
    }

    public onShutdown(handler: () => unknown): void {
        this.shutdownHandlers.push(handler);
    }

    public async start(): Promise<void> {
        // quit on ctrl-c when running docker in terminal
        process.on('SIGINT', () => {
            logger.error(`Got SIGINT. Graceful shutdown ${new Date().toISOString()}`);
            this.shutdown();
        });
        // quit properly on docker stop
        process.on('SIGTERM', () => {
            logger.error(`Got SIGTERM. Graceful shutdown ${new Date().toISOString()}`);
            this.shutdown();
        });

        logger.info(`Starting Service`);
        await this.configureDb();
        await this.configureServer();

        this.configureExpress();

        this.startHandlers.forEach(async (handler) => await handler());
    }

    public async shutdown(): Promise<void> {
        logger.info('Shutting down Service.');

        if (this.database) {
            await mongoose.disconnect();
            logger.info('Database disconnected.');
        }

        if (this.server) {
            await this.server.close();
            logger.info('Express server stopped.');
        }

        await Promise.all(this.shutdownHandlers.map((handler) => handler()))
            .then((results) => results.forEach((message) => logger.log(message as LogEntry)))
            .then(() => logger.info(`Service stopped!`))
            .catch((error: Error) => {
                logger.error(error);
                process.exit(1);
            });
    }

    private async configureDb(): Promise<void> {
        const { MONGO_URI } = process.env;

        try {
            if (!MONGO_URI) {
                throw new Error('MONGODB_URI not set');
            }

            await mongoose.connect(MONGO_URI, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                useCreateIndex: true,
                keepAlive: true,
                useFindAndModify: false
            });

            logger.info('Database connected.');

            this.database = mongoose.connection;
        } catch (err) {
            console.log(err, 'ERRE');
            this.shutdown();
            logger.error('Database connection failure ', err.message || err);
        }
    }

    private onHealthCheck() {
        return async (_req: Request, response: Response) => {
            const statuses = {
                database: {
                    status: 'OK'
                },
                service: {
                    status: 'OK',
                    uptime: process.uptime()
                },
                healthy: true
            };

            if (!this.database) {
                statuses.database.status = 'db not connected.';
                statuses.healthy = false;
            }

            if (this.database?.readyState === 0 || this.database?.readyState === 3) {
                statuses.database.status = 'Mongoose has been disconnected.';
                statuses.healthy = false;
            }

            if (this.database?.readyState === 2) {
                statuses.database.status = 'Mongoose is connecting...';
                statuses.healthy = false;
            }

            logger.debug('Healthcare called: ', statuses);

            response.status(200).json(statuses);
        };
    }

    private configureServer() {
        this.app.use(compression());
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ type: 'application/json' }));
        this.app.use(express.urlencoded({ extended: false }));

        if (process.env.NODE_ENV !== 'test') {
            this.app.use(
                morgan('combined', {
                    skip: (request) => (request.baseUrl || request.originalUrl).includes('healthcheck'),
                    stream: {
                        write: (message: string) => {
                            console.log(message);
                            return logger.info(message);
                        }
                    }
                })
            );
        }
        this.server = http.createServer(this.app);

        const port = this.normalizePort(process.env.PORT || process.env.SERVER_PORT || '3000');
        this.server.listen(port);
        logger.info('Express server started.');
    }

    private configureExpress() {
        this.app.use(responseModule);
        this.app.use('/healthcheck', this.onHealthCheck());

        this.app.use('/v1/records', RecordsController);
        this.serveFrontend();
        this.app.use(notFound);
        this.app.use(errorHandler);
    }

    private normalizePort(val: string): number | boolean | string {
        const port = parseInt(val, 10);

        if (Number.isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    private serveFrontend() {
        if (!process.env.REACT_APP_IS_SERVED) {
            return this.app.get('/', (_: Request, response: Response) =>
                response.responseModule({ message: 'Welcome to the application.' })
            );
        }

        const DIST_DIR = path.join(__dirname, '../client/build');
        const HTML_FILE = path.join(DIST_DIR, 'index.html');

        this.app.use(express.static(DIST_DIR));
        this.app.get('/*', (_, response) => response.sendFile(HTML_FILE));
    }
}

export default new Application();
