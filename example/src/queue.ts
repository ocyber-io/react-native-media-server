export class Queue<T> {
  private paused: boolean = false;
  private items = new Array<T>();
  private dequeued = new Array<T>();

  get isEmpty() {
    return this.items.length === 0;
  }

  get isNotEmpty() {
    return this.items.length > 0;
  }

  get size() {
    return this.items.length;
  }

  get lastIndex() {
    return this.items.length - 1;
  }

  sort(compareFn?: (a: T, b: T) => number) {
    this.items.sort(compareFn);
  }

  delete(callback: (item: T) => boolean) {
    this.items = this.items.filter((item) => {
      return !callback(item);
    });
  }

  flush() {
    this.items = [];
  }

  flushWithCallback(callback: (item: T) => void) {
    for (let item of this.items) {
      callback(item);
    }
    this.items = [];
  }

  async flushWithCallbackAsync(callback: (item: T) => Promise<void>) {
    for (let item of this.items) {
      await callback(item);
    }
    this.items = [];
  }

  async nextAsyncCallback(callback: (item: T) => Promise<void>) {
    if (this.isNotEmpty) {
      const item = this.items.shift();
      if (item) {
        await callback(item);
      }
    }
  }

  start() {
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  waitForNextAvailable() {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (this.isNotEmpty && !this.paused) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  enqueue(item: T) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isNotEmpty) {
      const item = this.items.shift();
      this.dequeued.push(item);
      return item;
    }
    return null;
  }

  front() {
    if (this.isNotEmpty) {
      return this.items[0];
    }
    return null;
  }

  isExist(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return this.items.findIndex(predicate, thisArg) !== -1;
  }

  isDeQueued(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return this.dequeued.findIndex(predicate, thisArg) !== -1;
  }

  isNotExist(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return this.items.findIndex(predicate, thisArg) === -1;
  }

  some(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return this.items.some(predicate, thisArg);
  }

  every(
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: any
  ): boolean {
    return this.items.every(predicate, thisArg);
  }
}
