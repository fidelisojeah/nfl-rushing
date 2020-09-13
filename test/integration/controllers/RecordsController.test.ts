import { Records } from '../../../src/models/Records';

import Express from 'express';
import { Server } from 'http';

import request from 'supertest';

import { Application } from '../../../src/Application';
import { seedData } from '../../../src/seed';

describe('v1/records', () => {
    let express: Express.Application | undefined;
    let application: Application;

    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

        express = application.app;
        listenSpy.mockRestore();
        await seedData();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await Records.deleteMany({});
        await application.shutdown();
    });

    describe('GET /v1/records', () => {
        it('should return all records that match the filter (none)', async () => {
            const response = await request(express).get('/v1/records?title=xxxxxx').expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });

        it('should return all records that match single filter', async () => {
            const response = await request(express).get('/v1/records?Player=/aaro/i').expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            expect(response.body.data[0].Player.toLowerCase()).toContain('aaro');
        });

        it('should return records that match filter and sort', async () => {
            const response = await request(express)
                .get('/v1/records?Name=/bell/i&sort=-Yds')
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            expect(response.body.data[0].Player).toEqual(`Le'Veon Bell`);
        });
    });
});
