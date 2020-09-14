export interface IRecord {
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
    [key: string]: string | number;
}
