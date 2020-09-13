import mongoose from 'mongoose';
import { Serializer } from '../interfaces/Serializer';
import { RecordsInterface } from '../models/Records';

export interface RecordsDataInterface {
    Player: string;
    Team: string;
    Pos: string;
    Att: number;
    'Att/G': number;
    Yds: number | string;
    Avg: number;
    'Yds/G': number;
    TD: number;
    Lng: string | number;
    '1st': number;
    '1st%': number;
    '20+': number;
    '40+': number;
    FUM: number;
}

export class RecordsSerializer implements Serializer<RecordsInterface> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public serializeInput(data: RecordsDataInterface): RecordsInterface {
        return {
            name: data.Player,
            team: data.Team,
            position: data.Pos,
            rushingAttemptsPerGameAverage: mongoose.Types.Decimal128.fromString(data['Att/G'].toString()),
            rushingAttempts: data.Att,
            totalRushingYards: this.serializeTotalRushingYardsInput(data.Yds),
            rushingAverageYardsPerAttempt: mongoose.Types.Decimal128.fromString(data.Avg.toString()),
            rushingYardsPerGame: mongoose.Types.Decimal128.fromString(data['Yds/G'].toString()),
            totalRushingTouchDowns: data.TD,
            ...this.longestRushInput(data.Lng),
            rushingFirstDowns: data['1st'],
            rushingFirstDownPercentage: mongoose.Types.Decimal128.fromString(data['1st%'].toString()),
            rushing20Yards: data['20+'],
            rushing40Yards: data['40+'],
            rushingFumbles: data.FUM
        };
    }

    public serializeOutput(data: RecordsInterface): RecordsDataInterface {
        return {
            Player: data.name,
            Team: data.team,
            Pos: data.position,
            Att: data.rushingAttempts,
            'Att/G': Number(data.rushingAttemptsPerGameAverage.toString()),
            Yds: data.totalRushingYards,
            Avg: Number(data.rushingAverageYardsPerAttempt.toString()),
            'Yds/G': Number(data.rushingYardsPerGame.toString()),
            TD: data.totalRushingTouchDowns,
            Lng: `${data.longestRush}${data.longestRushHasTouchdown ? 'T' : ''}`,
            '1st': data.rushingFirstDowns,
            '1st%': Number(data.rushingFirstDownPercentage.toString()),
            '20+': data.rushing20Yards,
            '40+': data.rushing40Yards,
            FUM: data.rushingFumbles
        };
    }

    private serializeTotalRushingYardsInput(totalRushingYards: string | number): number {
        if (typeof totalRushingYards === 'string') {
            totalRushingYards = totalRushingYards.replace(/,/g, '');
        }

        return Number(totalRushingYards);
    }
    private longestRushInput(longestRushData: string | number) {
        let longestRushHasTouchdown = false;
        let longestRush = 0;

        if (typeof longestRushData === 'string' && longestRushData) {
            longestRushHasTouchdown = longestRushData.includes('T');
            longestRush = Number(longestRushData.replace(/T/g, ''));
        } else if (typeof longestRushData === 'number' && longestRushData) {
            longestRush = longestRushData;
        }

        return {
            longestRush,
            longestRushHasTouchdown
        };
    }
}

export default new RecordsSerializer();
