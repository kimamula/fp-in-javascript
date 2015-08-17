import LazyArray, {ILazyArray, Empty} from '../src/LazyArray';
import {assert} from 'chai';
import 'babel/polyfill';

describe('LazyArray', () => {
    describe('factory', () => {
        it('can function with a native array', () => {
            let lazyArray = LazyArray([0, 1, 2]);

            assert.strictEqual(lazyArray.head, 0);
            assert.strictEqual(lazyArray.tail.head, 1);
            assert.strictEqual(lazyArray.tail.tail.head, 2);
            assert.strictEqual(lazyArray.tail.tail.tail, Empty);
            assert.strictEqual(lazyArray.length, 3);
        });
        it('can function with a generator function', () => {
            let lazyArray = LazyArray(function*() {
                    yield 'A';
                    yield 'B';
                    return 'C';
                }());

            assert.strictEqual(lazyArray.head, 'A');
            assert.strictEqual(lazyArray.tail.head, 'B');
            assert.strictEqual(lazyArray.tail.tail.head, 'C');
            assert.strictEqual(lazyArray.tail.tail.tail, Empty);
            assert.strictEqual(lazyArray.length, 3);
        });
    });
    describe('API', () => {
        [
            LazyArray(['Mathew', 'Mark', 'Luke', 'John']),
            LazyArray(function*(){
                yield 'Mathew';
                yield 'Mark';
                yield 'Luke';
                return 'John';
            }())
        ].forEach((lazyArray: ILazyArray<string>) => {
            it('can reduce right from left with #reduceRight()', () => {
                lazyArray.reduceRight((acc: () => number, current: string, index: number) => {
                    switch(index) {
                        case 0:
                            assert.strictEqual(current, 'Mathew');
                            assert.strictEqual(acc(), 6);
                            break;
                        case 1:
                            assert.strictEqual(current, 'Mark');
                            assert.strictEqual(acc(), 5);
                            break;
                        case 2:
                            assert.strictEqual(current, 'Luke');
                            assert.strictEqual(acc(), 3);
                            break;
                        case 3:
                            assert.strictEqual(current, 'John');
                            assert.strictEqual(acc(), 0);
                            break;
                        default:
                            assert.fail();
                            break;
                    }
                    return acc() + index;
                }, 0);
                assert.deepEqual(lazyArray.map((name: string, index: number) => {
                    return `Hello, ${name}: ${index}`;
                }).toArray(), [
                    'Hello, Mathew: 0',
                    'Hello, Mark: 1',
                    'Hello, Luke: 2',
                    'Hello, John: 3'
                ]);
            });
            it('can map each element with #map()', () => {
                assert.deepEqual(lazyArray.map((name: string, index: number) => {
                    return `Hello, ${name}: ${index}`;
                }).toArray(), [
                    'Hello, Mathew: 0',
                    'Hello, Mark: 1',
                    'Hello, Luke: 2',
                    'Hello, John: 3'
                ]);
            });
            it('can judge if any of its element fill the given condition with #some()', () => {
                assert.isTrue(lazyArray.some((name: string, index: number) => {
                    return name.startsWith('M');
                }));
                assert.isFalse(lazyArray.some((name: string, index: number) => {
                    return index > 3;
                }));
            });
            it('can judge if every element fill the given condition with #every()', () => {
                assert.isFalse(lazyArray.every((name: string, index: number) => {
                    return name.length > 4;
                }));
                assert.isTrue(lazyArray.every((name: string, index: number) => {
                    return index <= 3;
                }));
            });
            it('can filter its elements with #filter()', () => {
                assert.deepEqual(lazyArray.filter((name: string, index: number) => {
                    return name.length < index * 2;
                }).toArray(), ['John']);
            });
            it('can take elements while the given condition is filled with #takeWhile())', () => {
                assert.deepEqual(lazyArray.takeWhile((name: string, index: number) => {
                    return index > 2 || name.length > index * 2;
                }).toArray(), ['Mathew', 'Mark']);
            });
            it('can take first n elements with #take())', () => {
                assert.deepEqual(lazyArray.take(1).toArray(), ['Mathew']);
            });
            it('can return the index of an element with #indexOf()', () => {
                assert.strictEqual(lazyArray.indexOf('Luke'), 2);
            });
            it('can iterate over its elemente with #forEach()', () => {
                let result: string[] = [];
                lazyArray.forEach((name: string, index: number) => {
                    result.push(`No ${index + 1}: ${name}`);
                });
                assert.deepEqual(result, ['No 1: Mathew', 'No 2: Mark', 'No 3: Luke', 'No 4: John']);
            });
            it('can append an element with #append()', () => {
                assert.deepEqual(lazyArray.append('Paul').toArray(), ['Mathew', 'Mark', 'Luke', 'John', 'Paul']);
            });
            it('can prepend an element with #prepend()', () => {
                assert.deepEqual(lazyArray.prepend('David').toArray(), ['David', 'Mathew', 'Mark', 'Luke', 'John']);
            });
            it('can convert to a native array with #toArray()', () => {
                assert.deepEqual(lazyArray.toArray(), ['Mathew', 'Mark', 'Luke', 'John']);
            });
        });
    });
    describe('laziness', () => {
        [
            LazyArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
            LazyArray(function*(){
                for (let i = 0; i < 10; i++) {
                    yield i;
                }
            }())
        ].forEach((lazyArray: ILazyArray<number>) => {
            let mapCallCount = 0,
                map = (i: number) => {
                    mapCallCount++;
                    return i * 2;
                },
                mappedArray = lazyArray.map(map);
            it('should not evaluate its elements until needed', () => {
                assert.strictEqual(mapCallCount, 0);

                assert.strictEqual(mappedArray.head, 0);
                assert.strictEqual(mapCallCount, 1);

                assert.strictEqual(mappedArray.tail.head, 2);
                assert.strictEqual(mapCallCount, 2);

                assert.strictEqual(mappedArray.length, 10);
                assert.strictEqual(mapCallCount, 2);
            });
            it('should cache the result of evaluation to avoid re-evaluation', () => {
                mapCallCount = 0;

                assert.strictEqual(mappedArray.head, 0);
                assert.strictEqual(mapCallCount, 0);

                assert.strictEqual(mappedArray.tail.head, 2);
                assert.strictEqual(mapCallCount, 0);

                assert.strictEqual(mappedArray.length, 10);
                assert.strictEqual(mapCallCount, 0);
            });
        });
    });
    describe('with infinite length', () => {
        it('can be handled without running into infinite loop', () => {
            let fibonacci = LazyArray(function*() {
                    let pre = 0, cur = 1;
                    for (;;) {
                      let temp = pre;
                      pre = cur;
                      cur += temp;
                      yield cur;
                    }
                }());

            assert.isTrue(fibonacci.some((i: number) => {return i % 2 === 0;}));
            assert.deepEqual(fibonacci.map((i: number) => {
                return i * 3;
            }).takeWhile((i : number) => {
                return i < 100;
            }).toArray(), [3, 6, 9, 15, 24, 39, 63]);
        })
    });
});
