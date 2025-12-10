/**
 * AsyncQueue - Promise-based async queue for message handling
 * Based on Signal Desktop's AsyncQueue implementation
 */

export class AsyncQueue<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private resolvers: Array<(value: IteratorResult<T>) => void> = [];
  private isComplete = false;

  /**
   * Add item to queue. If consumers are waiting, resolve immediately.
   */
  enqueue(item: T): void {
    if (this.isComplete) {
      throw new Error('Cannot enqueue to completed queue');
    }

    const resolver = this.resolvers.shift();
    if (resolver) {
      // Consumer waiting, resolve immediately
      resolver({ value: item, done: false });
    } else {
      // No consumer waiting, add to queue
      this.queue.push(item);
    }
  }

  /**
   * Mark queue as complete. Future iterations will end.
   */
  complete(): void {
    this.isComplete = true;
    // Resolve all waiting consumers with done=true
    for (const resolver of this.resolvers) {
      resolver({ value: undefined as T, done: true });
    }
    this.resolvers = [];
  }

  /**
   * AsyncIterable implementation - allows for-await-of usage
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      // If items in queue, yield immediately
      if (this.queue.length > 0) {
        const item = this.queue.shift()!;
        yield item;
        continue;
      }

      // If complete and queue empty, end iteration
      if (this.isComplete) {
        return;
      }

      // Wait for next item
      const result = await new Promise<IteratorResult<T>>((resolve) => {
        this.resolvers.push(resolve);
      });

      if (result.done) {
        return;
      }

      yield result.value;
    }
  }

  /**
   * Get current queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has waiting consumers
   */
  get hasWaitingConsumers(): boolean {
    return this.resolvers.length > 0;
  }
}
