/**
 * Simple reactive store implementation to replace Svelte stores.
 * Provides get(), set(), update() and subscribe() methods.
 */

export interface Subscriber<T> {
    (value: T): void;
}

export interface Unsubscriber {
    (): void;
}

export interface Writable<T> {
    get(): T;
    set(value: T): void;
    update(updater: (value: T) => T): void;
    subscribe(subscriber: Subscriber<T>): Unsubscriber;
}

export function writable<T>(initialValue: T): Writable<T> {
    let value = initialValue;
    const subscribers: Set<Subscriber<T>> = new Set();

    function get(): T {
        return value;
    }

    function set(newValue: T): void {
        value = newValue;
        subscribers.forEach((subscriber) => subscriber(value));
    }

    function update(updater: (value: T) => T): void {
        set(updater(value));
    }

    function subscribe(subscriber: Subscriber<T>): Unsubscriber {
        subscribers.add(subscriber);
        subscriber(value); // Call immediately with current value
        return () => {
            subscribers.delete(subscriber);
        };
    }

    return { get, set, update, subscribe };
}
