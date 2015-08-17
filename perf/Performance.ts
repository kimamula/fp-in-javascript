/// <reference path="../src/LazyArray.ts"/>
/// <reference path="../typings/tsd.d.ts"/>

import LazyArray, {ILazyArray} from '../src/LazyArray';

function increment(x: number): number {
    return x + 1;
}

function numbersArray(count: number): number[] {
    let result: number[] = [];
    for (let i = 0; i < count; i++) {
        result.push(i);
    }
    return result;
}

function mapx10000_take10toArrayx1_take10toArrayx100<T>(args: {
    type: string;
    input: T;
    map: (t: T, func: (x: number) => number) => T;
    take: (t: T, count: number) => T;
    toArray: (t: T) => Array<any>;
}): void {
    let result: number[],
        start = new Date().getTime(),
        _input = args.input;
    for (let i = 0; i < 10000; i ++) {
        _input = args.map(_input, increment);
    }
    let mapEnd = new Date().getTime();
    console.log(`${args.type} map x 10000`, mapEnd - start);
    result = args.toArray(args.take(_input, 10));
    let take1End = new Date().getTime();
    console.log(`${args.type} take first 10 elements and toArray x 1`, take1End - mapEnd, result);
    for (let i = 0; i < 100; i ++) {
        result = args.toArray(args.take(_input, 10));
    }
    let take100End = new Date().getTime();
    console.log(`${args.type} take first 10 elements and toArray x 100`, take100End - take1End, result);
    console.log(`${args.type} total`, take100End - start, result);
}

function compare(input: number[]) {
    console.log(`Result with an array containing ${input.length} elements`);

    mapx10000_take10toArrayx1_take10toArrayx100({
        'type': 'native',
        'input': input,
        'map': (t: number[], func: (x: number) => number) => {
            return t.map(func);
        },
        'take': (t: number[], count: number) => {
            return t.slice(0, count);
        },
        'toArray': (t: number[]) => {
            return t;
        }
    });

    mapx10000_take10toArrayx1_take10toArrayx100({
        'type': 'LazyArray',
        'input': LazyArray(input),
        'map': (t: ILazyArray<number>, func: (x: number) => number) => {
            return t.map(func);
        },
        'take': (t: ILazyArray<number>, count: number) => {
            return t.take(count);
        },
        'toArray': (t: ILazyArray<number>) => {
            return t.toArray();
        }
    });

    mapx10000_take10toArrayx1_take10toArrayx100({
        'type': 'Lazy.js',
        'input': Lazy(input),
        'map': (t: LazyJS.Sequence<number>, func: (x: number) => number) => {
            return t.map(func);
        },
        'take': (t: LazyJS.Sequence<number>, count: number) => {
            return t.first(count);
        },
        'toArray': (t: LazyJS.Sequence<number>) => {
            return t.toArray();
        }
    });

    mapx10000_take10toArrayx1_take10toArrayx100({
        'type': 'lodash',
        'input': input,
        'map': (t: number[], func: (x: number) => number) => {
            return _.map(t, func);
        },
        'take': (t: number[], count: number) => {
            return _.take(t, count);
        },
        'toArray': (t: number[]) => {
            return t;
        }
    });
}
console.log('start');
[100, 10000].map(numbersArray).forEach(compare);
