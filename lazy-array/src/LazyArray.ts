export interface ILazyArray<A> {
    isEmpty: boolean;
    head: A;
    tail: ILazyArray<A>;
    length: number;
    reduceRight<B>(f: (acc: () => B, current: () =>  A, index: number) => B, initial: B): B;
    some(f: (a: A, index: number) => boolean): boolean;
    every(f: (a: A, index: number) => boolean): boolean;
    map<B>(f: (a: A, index: number) => B): ILazyArray<B>;
    filter(f: (a: A, index: number) => boolean): ILazyArray<A>;
    takeWhile(f: (a: A, index: number) => boolean): ILazyArray<A>;
    take(count: number): ILazyArray<A>;
    indexOf(a: A): number;
    forEach(f: (a: A, index: number) => any): void;
    append(a: A): ILazyArray<A>;
    prepend(a: A): ILazyArray<A>;
    toArray(): A[];
}

export default function LazyArray<A>(arg: {[Symbol.iterator](): IterableIterator<A>;}): ILazyArray<A> {
    let iterator = arg[Symbol.iterator](),
        head = iterator.next(),
        headValue = head.value;
    if (head.done) {
        if (typeof headValue === 'undefined') {
            return Empty;
        } else {
            return Empty.append(headValue);
        }
    } else {
        return new LazyArrayImpl(
            () => {
                return headValue;
            },
            () => {
                return LazyArray(iterator);
            }
        );
    }
}

class LazyArrayImpl<A> implements ILazyArray<A> {
    private _length: number = null;
    private _head: A;
    private headEvaluated = false;
    private _tail: ILazyArray<A>;
    private tailEvaluated = false;
    constructor(
        private getHead: () => A,
        private getTail: () => ILazyArray<A>
    ) {}

    isEmpty = false;

    get head(): A {
        if (!this.headEvaluated) {
            this.headEvaluated = true;
            this._head = this.getHead();
        }
        return this._head;
    }

    get tail(): ILazyArray<A> {
        if (!this.tailEvaluated) {
            this.tailEvaluated = true;
            this._tail = this.getTail();
        }
        return this._tail;
    }

    get length(): number {
        if (this._length === null) {
            this._length = this.tail.length + 1;
        }
        return this._length;
    }

    reduceRight<B>(f: (acc: () => B, current: () => A, index: number) => B, initial: B, index = 0): B {
        let acc: B = null,
            accEvaluated = false,
            self = this;
        return f(
            () => {
                if (!accEvaluated) {
                    accEvaluated = true;
                    acc = (<LazyArrayImpl<A>>self.tail).reduceRight(f, initial, index + 1);
                }
                return acc;
            },
            () => {
                return this.head;
            },
            index
        );
    }

    some(f: (a: A, index: number) => boolean): boolean {
        return this.reduceRight((acc: () => boolean, current: () => A, index: number) => {
            return f(current(), index) || acc();
        }, false);
    }

    every(f: (a: A, index: number) => boolean): boolean {
        return this.reduceRight((acc: () => boolean, current: () => A, index: number) => {
            return f(current(), index) && acc();
        }, true);
    }

    map<B>(f: (a: A, index: number) => B): ILazyArray<B> {
        return this.reduceRight((acc: () => ILazyArray<B>, current: () => A, index: number) => {
            return new LazyArrayImpl(
                () => {
                    return f(current(), index);
                },
                () => {
                    return acc();
                }
            );
        }, Empty);
    }

    filter(f: (a: A, index: number) => boolean): ILazyArray<A> {
        return this.reduceRight((acc: () => ILazyArray<A>, current: () => A, index: number) => {
            if (f(current(), index)) {
                return new LazyArrayImpl(
                    () => {
                        return current();
                    },
                    () => {
                        return acc();
                    }
                );
            } else {
                // Cannot avoid immediate evaluation here...
                return acc();
            }
        }, Empty);
    }

    takeWhile(f: (a: A, index: number) => boolean): ILazyArray<A> {
        return this.reduceRight((acc: () => ILazyArray<A>, current: () => A, index: number) => {
            if (f(current(), index)) {
                return new LazyArrayImpl(
                    () => {
                        return current();
                    },
                    () => {
                        return acc();
                    }
                );
            } else {
                return Empty;
            }
        }, Empty);
    }

    take(count: number): ILazyArray<A> {
        return this.takeWhile((a: A, index: number) => {
            return index < count;
        });
    }

    indexOf(a: A): number {
        let result = -1;
        this.some((_a: A, index: number) => {
            if (a === _a) {
                result = index;
                return true;
            }
            return false;
        });
        return result;
    }

    forEach(f: (a: A, index: number) => any): void {
        let current: ILazyArray<A> = this, index = 0;
        while (!current.isEmpty) {
            f(current.head, index++);
            current = current.tail;
        }
    }

    append(a: A): ILazyArray<A> {
        return this.reduceRight((acc: () => ILazyArray<A>, current: () => A) => {
            return new LazyArrayImpl(
                () => {
                    return current();
                },
                () => {
                    return acc();
                }
            );
        }, Empty.append(a));
    }

    prepend(a: A): ILazyArray<A>{
        return new LazyArrayImpl(
            () => {
                return a;
            },
            () => {
                return this;
            }
        );
    }

    toArray(): A[] {
        let result: A[] = [];
        this.forEach((a: A) => {
            result.push(a);
        });
        return result;
    }
}

export const Empty: ILazyArray<any> = {
    get isEmpty(): boolean {
        return true;
    },
    get head(): any {
        return void 0;
    },
    get tail(): ILazyArray<any> {
        return void 0;
    },
    get length(): number {
        return 0;
    },
    get reduceRight(): <B>(f: (acc: () => B, current: () => any, index: number) => B, initial: B) => B {
        return <B>(f: (acc: () => B, current: () => any, index: number) => B, initial: B) => {
            return initial;
        };
    },
    get some(): (f: (a: any, index: number) => boolean) => boolean {
        return () => {
            return false;
        };
    },
    get every(): (f: (a: any, index: number) => boolean) => boolean {
        return () => {
            return false;
        };
    },
    get map(): <B>(f: (a: any, index: number) => B) => ILazyArray<B> {
        return () => {
            return Empty;
        }
    },
    get filter(): (f: (a: any, index: number) => boolean) => ILazyArray<any> {
        return () => {
            return Empty;
        }
    },
    get takeWhile(): (f: (a: any, index: number) => boolean) => ILazyArray<any> {
        return () => {
            return Empty;
        }
    },
    get take(): (count: number) => ILazyArray<any> {
        return () => {
            return void 0;
        }
    },
    get indexOf(): (a: any) => number {
        return () => {
            return -1;
        }
    },
    get forEach(): (f: (a: any, index: number) => any) => void {
        return () => {};
    },
    get append(): <A>(a: A) => ILazyArray<A> {
        return <A>(a: A) => {
            return new LazyArrayImpl(
                () => {
                    return a;
                },
                () => {
                    return Empty;
                }
            );
        }
    },
    get prepend(): <A>(a: A) => ILazyArray<A> {
        return Empty.append
    },
    get toArray(): () => any[] {
        return () => {
            return [];
        };
    }
};
