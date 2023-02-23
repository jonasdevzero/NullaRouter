export class Stack<T> {
  items: Array<T> = [];

  push(element: T) {
    this.items.push(element);
  }

  pop() {
    return this.items.pop() || null;
  }

  peek() {
    return this.items[this.size - 1];
  }

  isEmpty() {
    return this.size === 0;
  }

  clear() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }
}
