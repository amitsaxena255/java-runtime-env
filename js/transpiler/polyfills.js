export const JAVA_POLYFILLS = `
class HashSet extends Set {
    add(val) { super.add(val); return true; }
    contains(val) { return super.has(val); }
    remove(val) { return super.delete(val); }
    isEmpty() { return super.size === 0; }
}

class HashMap extends Map {
    put(key, val) { super.set(key, val); return val; }
    get(key) { return super.get(key); }
    containsKey(key) { return super.has(key); }
    remove(key) { return super.delete(key); }
    isEmpty() { return super.size === 0; }
    keySet() { return Array.from(super.keys()); }
    values() { return Array.from(super.values()); }
}

class ArrayList extends Array {
    add(val) { super.push(val); return true; }
    get(index) { return this[index]; }
    set(index, val) { this[index] = val; }
    remove(index) { return this.splice(index, 1)[0]; }
    size() { return this.length; }
    isEmpty() { return this.length === 0; }
}
`;
