class IndexedDBHelper {
	private dbName: string;
	private storeName: string;

	constructor(dbName: string = "KlineChartsDB", storeName: string = "klineChartsDrawings") {
		this.dbName = dbName;
		this.storeName = storeName;
	}

	private open(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request: IDBOpenDBRequest = indexedDB.open(this.dbName, 1);

			request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async get<T = unknown>(key: IDBValidKey): Promise<T | undefined> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readonly");
			const store = tx.objectStore(this.storeName);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result as T);
			request.onerror = () => reject(request.error);
		});
	}

	async set<T = unknown>(key: IDBValidKey, value: T): Promise<boolean> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const request = store.put(value, key);

			request.onsuccess = () => resolve(true);
			request.onerror = () => reject(request.error);
		});
	}

	async del(key: IDBValidKey): Promise<boolean> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const request = store.delete(key);

			request.onsuccess = () => resolve(true);
			request.onerror = () => reject(request.error);
		});
	}

	async clear(): Promise<boolean> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const request = store.clear();

			request.onsuccess = () => resolve(true);
			request.onerror = () => reject(request.error);
		});
	}

	async getAllKeys(): Promise<IDBValidKey[]> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readonly");
			const store = tx.objectStore(this.storeName);
			const request = store.getAllKeys();

			request.onsuccess = () => resolve(request.result as IDBValidKey[]);
			request.onerror = () => reject(request.error);
		});
	}

	async getAll<T = unknown>(): Promise<T[]> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readonly");
			const store = tx.objectStore(this.storeName);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result as T[]);
			request.onerror = () => reject(request.error);
		});
	}
}

export default IndexedDBHelper
