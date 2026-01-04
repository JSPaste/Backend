import { BTree } from "./btree.ts";

export class IPQ<K, V> {
  private readonly tree = new BTree<number, Map<K, V>>();
  private readonly priority = new Map<K, number>();

  public set(priority: number, key: K, value: V): void {
    const oldPriority = this.priority.get(key);
    if (oldPriority !== undefined) {
      const entries = this.tree.get(oldPriority);
      if (entries) {
        entries.delete(key);
        if (entries.size === 0) {
          this.tree.delete(oldPriority);
        }
      }
    }

    let entries = this.tree.get(priority);
    if (!entries) {
      entries = new Map<K, V>();
      this.tree.set(priority, entries);
    }
    entries.set(key, value);
    this.priority.set(key, priority);
  }

  public get(key: K): V | undefined {
    const priority = this.priority.get(key);
    if (priority === undefined) return;

    return this.tree.get(priority)?.get(key);
  }

  public has(key: K): boolean {
    return this.priority.has(key);
  }

  public delete(key: K): boolean {
    const priority = this.priority.get(key);
    if (priority === undefined) return false;

    const entries = this.tree.get(priority);
    if (entries) {
      entries.delete(key);
      if (entries.size === 0) {
        this.tree.delete(priority);
      }
    }
    this.priority.delete(key);
    return true;
  }

  public *entries(): Generator<[number, K, V], void, unknown> {
    for (const [priority, entries] of this.tree.entries()) {
      for (const [key, value] of entries) {
        yield [priority, key, value];
      }
    }
  }

  public *drain(): Generator<[number, K, V], void, unknown> {
    while (this.tree.size > 0) {
      const priority = this.tree.maxKey()!;
      const entries = this.tree.get(priority)!;

      for (const [key, value] of entries) {
        this.priority.delete(key);
        yield [priority, key, value];
      }

      this.tree.delete(priority);
    }
  }

  public [Symbol.dispose](): void {
    this.tree.clear();
    this.priority.clear();
  }
}
