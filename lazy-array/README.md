LazyArray
==========
Lazy implementation of array, which corresponds to the chapter 5 of "FP in Scala".

## Usage

The below code is the brief explanation of the usage. See test/LazyArrayTest.ts for detail.

```typescript
// can be created with a native array
var lazyArray = LazyArray([0, 1, 2]);
var mapped = lazyArray.map((e: number, index: number) => {
    return e * index; // calculation is delayed until the element is actually referred to
});

// can also be create with a generator function
var fibonacci = LazyArray(function*() {
    let pre = 0, cur = 1;
    for (;;) {
      let temp = pre;
      pre = cur;
      cur += temp;
      yield cur;
    }
}());
```

## Performance

The performance of this implementation can be compared with native array as well as other libraries ([lodash](https://github.com/lodash/lodash) and [Lazy.js](https://github.com/dtao/lazy.js)) by executing the below commands and opening index.html in your browser.

```sh
$ npm install
$ npm run bundle
```

The below code is the core function of the test code: mapping followed by taking first 10 elements from an array is performed with each library (or native array) and the result is shown in the console.

```typescript
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
    for (let i = 0; i < 1000; i ++) {
        _input = args.map(_input, increment);
    }
    let mapEnd = new Date().getTime();
    console.log(`${args.type} map x 1000`, mapEnd - start);
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
```

**Note that this performance comparison is intended to highlight the feature of the lazy implementation rather than strictly compare performance among implementations on a fair basis.**

#### Result of the performance comparison with Chrome 44 (*)

Implementation | Array length | Mapping (ms) | Take x 1 (ms) | Take x 100 (ms) | Total (ms)
-------------- | ------------ | ------------ | ------------- | --------------- | -----------
Native | 100   | 16.0 ± 2.6 | 0.3 ± 0.6 | 2.0 ± 1.0 | 18.3 ± 3.1
Native | 10000 | 915.3 ± 120.8 | 0.0 ± 0.0 | 1.3 ± 0.6 | 916.7 ± 120.9
LazyArray (this) | 100   | 3.3 ± 0.6 | 22.7 ± 3.8 | 5.3 ± 2.5 | 31.3 ± 2.5
LazyArray (this) | 10000 | 0.7 ± 0.6 | 11.7 ± 4.0 | 2.7 ± 1.2 | 15.0 ± 4.6
[Lazy.js](https://github.com/dtao/lazy.js) | 100   | 0.7 ± 0.6 | 41.0 ± 1.0 | 3562.0 ± 196.0 | 3603.7 ± 197.5
[Lazy.js](https://github.com/dtao/lazy.js) | 10000 | 1.0 ± 0.0 | 51.7 ± 5.5 | 3529.3 ± 308.9 | 3582.0 ± 314.0
[lodash](https://github.com/lodash/lodash) | 100   | 4.3 ± 0.6 | 0.3 ± 0.6 | 2.0 ± 0.0 | 6.7 ± 0.6
[lodash](https://github.com/lodash/lodash) | 10000 | 53.7 ± 9.8 | 0.3 ± 0.6 | 1.7 ± 0.6 | 55.7 ± 9.9

\* The values are the averages of three examinations.
