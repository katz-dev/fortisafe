declare namespace chrome {
    namespace storage {
        namespace local {
            function set(items: { [key: string]: any }, callback?: () => void): void;
            function get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
            function remove(keys: string | string[], callback?: () => void): void;
            function clear(callback?: () => void): void;
        }
    }
} 