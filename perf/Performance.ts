/// <reference path="../src/LazyArray.ts"/>
/// <reference path="../typings/tsd.d.ts"/>

import LazyArray from '../src/LazyArray';

function increment(x: number): number {
    return x + 1;
}

function isEven(x: number): boolean {
    return x % 2 === 0;
}

function isMultiplesOfThree(x: number): boolean {
    return x % 3 === 0;
}

function numbersArray(count: number): number[] {
    let result: number[] = [];
    for (let i = 0; i < count; i++) {
        result.push(i);
    }
    return result;
}

function compare(input: number[]) {
    console.log(`Result with an array containing ${input.length} elements`);

    let resultNative: number[] = [],
        startNative = new Date().getTime();
    // input.map(increment).filter(isEven).map(increment).filter(isMultiplesOfThree).forEach((i: number) => {
    //     resultNative.push(i);
    // });
    let mapNative = input;
    for (let i = 0; i < 10000; i ++) {
        mapNative = mapNative.map(increment);
    }
    console.log('native', new Date().getTime() - startNative, resultNative);

    let resultLazyArray: number[] = [],
        startLazyArray = new Date().getTime();
    // LazyArray(input).map(increment).filter(isEven).map(increment).filter(isMultiplesOfThree).forEach((i: number) => {
    //     resultLazyArray.push(i);
    // });
    let mapLazyArray = LazyArray(input);
    for (let i = 0; i < 10000; i ++) {
        mapLazyArray = mapLazyArray.map(increment);
    }
    console.log('LazyArray', new Date().getTime() - startLazyArray, resultLazyArray);

    let resultLazy: number[] = [],
        startLazy = new Date().getTime();
    // Lazy(input).map(increment).filter(isEven).map(increment).filter(isMultiplesOfThree).each((i: number) => {
    //     resultLazy.push(i);
    // });
    let mapLazy = Lazy(input);
    for (let i = 0; i < 10000; i ++) {
        mapLazy = mapLazy.map(increment);
    }
    console.log('Lazy.js', new Date().getTime() - startLazy, resultLazy);

    let resultLodash: number[] = [],
        startLodash = new Date().getTime();
    // _.forEach(_.filter(_.map(_.filter(_.map(input, increment), isEven), increment), isMultiplesOfThree), (i: number) => {
    //     resultLodash.push(i);
    // });
    let mapLodash = input;
    for (let i = 0; i < 10000; i ++) {
        mapLodash = _.map(mapLodash, increment);
    }
    console.log('lodash', new Date().getTime() - startLodash, resultLodash);
}
console.log('start');
[10, 100, 1000].map(numbersArray).forEach(compare);
