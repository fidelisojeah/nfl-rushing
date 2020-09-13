import mongoose from 'mongoose';
import data from './rushing.json';
import RecordsSerializer from '../serializer/RecordsSerializer';
import { Records } from '../models/Records';

import '../utils/load-envs';
import { logger } from '../utils';

export async function seedData(exit = false): Promise<void> {
    const { MONGO_URI } = process.env;
    try {
        if (!MONGO_URI) {
            throw new Error('`MONGODB_URI` not set');
        }

        await mongoose.connect(MONGO_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            keepAlive: true,
            useFindAndModify: false
        });
    } catch (err) {
        throw new Error('Error connecting to db');
    }

    logger.info(`Attempting to seed ${data.length} records`);

    await Promise.all(
        data.map(async (value) => {
            const recordData = RecordsSerializer.serializeInput(value);
            try {
                let record = await Records.findOne({ name: recordData.name });
                if (record) {
                    logger.debug(`Record found, updating...`);
                    await record.update(recordData);
                } else {
                    logger.debug('New record, creating...');
                    record = await new Records(recordData).save();
                }

                return record;
            } catch (err) {
                console.log(err, 'Failed to seed record', recordData, value);
            }
        })
    );
    // Done
    exit && process.exit(0);
}

process.argv[2] === 'run-seed' && seedData(true);
