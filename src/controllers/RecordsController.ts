import * as express from 'express';
import { EOL } from 'os';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import stream from 'stream';
import util from 'util';
import path from 'path';

import { Records, RecordsDocument } from '../models/Records';
import RecordsSerializer from '../serializer/RecordsSerializer';
import BaseController from './BaseController';
import { logger } from '../utils';

export class RecordsController extends BaseController {
    pipeline = util.promisify(stream.pipeline);
    private mapFilter(filter: Record<string, unknown>) {
        if (!filter) {
            return {};
        }
        const filterParams: Record<string, unknown> = {};

        const { Name, Player, name, ...rest } = filter;

        if (filter.hasOwnProperty('Player') || filter.hasOwnProperty('Name') || filter.hasOwnProperty('name')) {
            filterParams.name = name || Player || Name;
        }

        return { ...rest, ...filterParams };
    }

    private mapSort(sort: Record<string, unknown>) {
        if (!sort) {
            return undefined;
        }
        const { Yds, totalRushingYards, longestRush, totalRushingTouchDowns, Lng, TD, ...rest } = sort;
        const sortParams: Record<string, unknown> = {};

        for (const key in sort) {
            if (key === 'Yds' || key === 'totalRushingYards') {
                sortParams.totalRushingYards = totalRushingYards || Yds;
            }
            if (key === 'Lng' || key === 'longestRush') {
                sortParams.longestRush = longestRush || Lng;
            }
            if (key === 'TD' || key === 'totalRushingTouchDowns') {
                sortParams.totalRushingTouchDowns = totalRushingTouchDowns || TD;
            }
        }

        return {
            ...rest,
            ...sortParams
        };
    }

    private async getRecords(request: express.Request, response: express.Response) {
        const { page = 1, limit = 100, ...query } = request.query;
        const { filter, sort } = this.mongooseQueryParser.parse(query);
        let data: RecordsDocument[] = [];

        const actualLimit = Number(limit) || 100;
        const count = await Records.countDocuments(this.mapFilter(filter));

        if (page) {
            const skip = ((Number(page) || 1) - 1) * actualLimit;
            data = await Records.find(this.mapFilter(filter))
                .sort(this.mapSort(sort))
                .limit(actualLimit)
                .skip(skip)
                .exec();
        }

        response.responseModule(
            {
                data,
                status: StatusCodes.OK,
                meta: {
                    page: Number(page),
                    count,
                    limit: actualLimit
                }
            },
            RecordsSerializer
        );
    }
    private async generateRecords(request: express.Request, response: express.Response) {
        const generatedFilename = Buffer.from(JSON.stringify(request.query)).toString('base64').replace(/=/g, '_');
        response.header('Content-Type', 'text/csv').attachment('records.csv');

        try {
            const outputFile = fs.readFileSync(path.join(__dirname, `../../cache/${generatedFilename}.csv`));
            if (outputFile) {
                return response.send(outputFile);
            }
        } catch (err) {
            logger.debug('No cached file found');
        }

        const { filter, sort } = this.mongooseQueryParser.parse(request.query);

        const data = await Records.find(this.mapFilter(filter))
            .sort(this.mapSort(sort))
            .cursor({
                transform: (doc: RecordsDocument) =>
                    `${Object.values(RecordsSerializer.serializeOutput(doc)).join(', ')}${EOL}`
            });

        const outputFile = fs.createWriteStream(path.join(__dirname, `../../cache/${generatedFilename}.csv`));

        await this.pipeline(data, outputFile);

        response.sendFile(path.join(__dirname, `../../cache/${generatedFilename}.csv`));
    }

    protected setupRoutes(): void {
        this.router.get('/', this.getRecords.bind(this));
        this.router.get('/csv', this.generateRecords.bind(this));
    }
}

export default new RecordsController().router;
