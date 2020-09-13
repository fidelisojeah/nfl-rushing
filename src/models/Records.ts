import { Document, SchemaDefinition, SchemaOptions, Schema, model, Types } from 'mongoose';

export interface RecordsInterface {
    name: string;
    team: string;
    position: string;
    rushingAttemptsPerGameAverage: Types.Decimal128;
    rushingAttempts: number;
    totalRushingYards: number;
    rushingAverageYardsPerAttempt: Types.Decimal128;
    rushingYardsPerGame: Types.Decimal128;
    totalRushingTouchDowns: number;
    longestRush: number;
    longestRushHasTouchdown: boolean;
    rushingFirstDowns: number;
    rushingFirstDownPercentage: Types.Decimal128;
    rushing20Yards: number;
    rushing40Yards: number;
    rushingFumbles: number;
}

export type RecordsDocument = RecordsInterface & Document;

class RecordsSchema extends Schema<RecordsInterface> {
    constructor() {
        const schema: SchemaDefinition = {
            name: {
                type: String,
                required: true
            },
            team: {
                type: String,
                required: true
            },
            position: {
                type: String,
                required: true
            },
            rushingAttemptsPerGameAverage: {
                type: Types.Decimal128,
                required: true
            },
            rushingAttempts: {
                type: Number,
                required: true
            },
            totalRushingYards: {
                type: Number,
                required: true
            },
            rushingAverageYardsPerAttempt: {
                type: Types.Decimal128,
                required: true
            },
            rushingYardsPerGame: {
                type: Types.Decimal128,
                required: true
            },
            totalRushingTouchDowns: {
                type: Number,
                required: true
            },
            longestRush: {
                type: Number,
                required: true
            },
            longestRushHasTouchdown: {
                type: Boolean,
                required: true,
                default: false
            },
            rushingFirstDowns: {
                type: Number,
                required: true
            },
            rushingFirstDownPercentage: {
                type: Types.Decimal128,
                required: true
            },
            rushing20Yards: {
                type: Number,
                required: true
            },
            rushing40Yards: {
                type: Number,
                required: true
            },
            rushingFumbles: {
                type: Number,
                required: true
            }
        };
        const options: SchemaOptions = {
            timestamps: true
        };

        super(schema, options);

        this.index({ name: 1, totalRushingYards: 1, longestRush: 1, totalRushingTouchDowns: 1 });
    }
}

export const Records = model<RecordsDocument>('Records', new RecordsSchema());
