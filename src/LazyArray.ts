export interface ILazyArray<A> {
    isEmpty: boolean;
    head: A;
    tail: ILazyArray<A>;
    length: number;
    reduceRight<B>(f: (arg: {acc: B; current: A; index: number;}) => B, initial: B): B;
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
}

export default function LazyArray<A>(arg: A[] | IterableIterator<A>): ILazyArray<A> {
    let iterator: IterableIterator<A>;
    if (arg instanceof Array) {
        iterator = (<A[]>arg)[Symbol.iterator]();
    } else {
        iterator = <IterableIterator<A>>arg;
    }
    let head = iterator.next();
    let headValue = head.value;
    if (head.done) {
        if (typeof headValue === 'undefined') {
            return Empty;
        } else {
            return Empty.append(headValue);
        }
    } else {
        let tail: ILazyArray<A>,
            tailEvaluated = false;
        return new LazyArrayImpl({
            'head': headValue,
            get tail(): ILazyArray<A> {
                if (!tailEvaluated) {
                    tailEvaluated = true;
                    tail = LazyArray(iterator);
                }
                return tail;
            }
        });
    }
}

class LazyArrayImpl<A> implements ILazyArray<A> {
    private _length: number = null;
    constructor(
        private contents: {
            head: A,
            tail: ILazyArray<A>
        }
    ) {}

    isEmpty = false;

    get head(): A {
        return this.contents.head;
    }

    get tail(): ILazyArray<A> {
        return this.contents.tail;
    }

    get length(): number {
        if (this._length === null) {
            this._length = this.tail.length + 1;
        }
        return this._length;
    }

    reduceRight<B>(f: (arg: {acc: B; current: A; index: number;}) => B, initial: B, index = 0): B {
        let acc: B = null,
            accEvaluated = false,
            self = this;
            // TODO オブジェクトの生成に時間がかかっているので、全体的にオブジェクトを作らないでできるか検討する
        return f({
            get acc(): B {
                if (!accEvaluated) {
                    accEvaluated = true;
                    acc = (<LazyArrayImpl<A>>self.tail).reduceRight(f, initial, index + 1);
                }
                return acc;
            },
            'current': this.head,
            'index': index
        });
    }

    some(f: (a: A, index: number) => boolean): boolean {
        return this.reduceRight((arg: {acc: boolean; current: A; index: number;}) => {
            return f(arg.current, arg.index) || arg.acc;
        }, false);
    }

    every(f: (a: A, index: number) => boolean): boolean {
        return this.reduceRight((arg: {acc: boolean; current: A; index: number;}) => {
            return f(arg.current, arg.index) && arg.acc;
        }, true);
    }

    map<B>(f: (a: A, index: number) => B): ILazyArray<B> {
        return this.reduceRight((arg: {acc: ILazyArray<B>; current: A; index: number;}) => {
            let head: B,
                headEvaluated = false;
            return new LazyArrayImpl({
                get head(): B {
                    if (!headEvaluated) {
                        headEvaluated = true;
                        head = f(arg.current, arg.index);
                    }
                    return head;
                },
                get tail(): ILazyArray<B> {
                    return arg.acc;
                }
            });
        }, Empty);
    }

    filter(f: (a: A, index: number) => boolean): ILazyArray<A> {
        return this.reduceRight((arg: {acc: ILazyArray<A>; current: A; index: number;}) => {
            if (f(arg.current, arg.index)) {
                return new LazyArrayImpl({
                    'head': arg.current,
                    get tail(): ILazyArray<A> {
                        return arg.acc;
                    }
                });
            } else {
                // Cannot avoid immediate evaluation here...
                return arg.acc;
            }
        }, Empty);
    }

    takeWhile(f: (a: A, index: number) => boolean): ILazyArray<A> {
        return this.reduceRight((arg: {acc: ILazyArray<A>; current: A; index: number;}) => {
            if (f(arg.current, arg.index)) {
                return new LazyArrayImpl({
                    'head': arg.current,
                    get tail(): ILazyArray<A> {
                        return arg.acc;
                    }
                });
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
            f(current.head, index);
            index += 1;
            current = current.tail;
        }
    }

    append(a: A): ILazyArray<A> {
        return this.reduceRight((arg: {acc: ILazyArray<A>; current: A;}) => {
            return new LazyArrayImpl({
                'head': arg.current,
                get tail(): ILazyArray<A> {
                    return arg.acc;
                }
            });
        }, Empty.append(a));
    }

    prepend(a: A): ILazyArray<A>{
        return new LazyArrayImpl({
            'head': a,
            'tail': this
        });
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
    get reduceRight(): <B>(f: (arg: {acc: B; current: any; index: number;}) => B, initial: B) => B {
        return <B>(f: (arg: {acc: B; current: any; index: number;}) => B, initial: B) => {
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
            return new LazyArrayImpl({
                'head': a,
                'tail': Empty
            });
        }
    },
    get prepend(): <A>(a: A) => ILazyArray<A> {
        return Empty.append
    }
};
