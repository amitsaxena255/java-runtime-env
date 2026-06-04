export const JAVA_POLYFILLS = `
class JavaIterator {
    constructor(array) {
        this.array = array;
        this.index = 0;
    }
    hasNext() {
        return this.index < this.array.length;
    }
    next() {
        return this.array[this.index++];
    }
}

class MapEntry {
    constructor(key, val) {
        this.key = key;
        this.value = val;
    }
    getKey() { return this.key; }
    getValue() { return this.value; }
}

class EntrySet {
    constructor(jsMap) {
        this.entries = Array.from(jsMap.entries()).map(([k, v]) => new MapEntry(k, v));
    }
    iterator() {
        return new JavaIterator(this.entries);
    }
    size() {
        return this.entries.length;
    }
}

class HashSet extends Set {
    add(val) { super.add(val); return true; }
    contains(val) { return super.has(val); }
    remove(val) { return super.delete(val); }
    isEmpty() { return super.size === 0; }
    iterator() { return new JavaIterator(Array.from(this)); }
}

class HashMap extends Map {
    put(key, val) { super.set(key, val); return val; }
    get(key) { return super.get(key); }
    containsKey(key) { return super.has(key); }
    remove(key) { return super.delete(key); }
    isEmpty() { return super.size === 0; }
    keySet() {
        const set = new HashSet();
        for (const key of super.keys()) {
            set.add(key);
        }
        return set;
    }
    values() {
        const list = new ArrayList();
        for (const val of super.values()) {
            list.push(val);
        }
        return list;
    }
    entrySet() { return new EntrySet(this); }
}

class ArrayList extends Array {
    add(val) { super.push(val); return true; }
    get(index) { return this[index]; }
    set(index, val) { this[index] = val; }
    remove(index) { return this.splice(index, 1)[0]; }
    size() { return this.length; }
    isEmpty() { return this.length === 0; }
    iterator() { return new JavaIterator(this); }
}
`;

