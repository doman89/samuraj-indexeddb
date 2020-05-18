interface GenericObject {
	id: number | string;
}

type Callback = (result: unknown[]) => unknown;

type EventName = 'database-manager-ready';

export const DatabaseManagerEventName: EventName = 'database-manager-ready';

export interface DatabaseManagerEventData extends CustomEvent {
	type: EventName;
}

export class DatabaseManager {
	private readonly CREATE_OBJECT = 'create';
	private readonly DELETE_OBJECT = 'delete';
	private readonly READ_OBJECT = 'read';
	private readonly READ_MODE = 'readonly';
	private readonly READ_WRITE_MODE = 'readwrite';
	private readonly UPDATE_OBJECT = 'update';

	private readonly IndexedDB = window.indexedDB;

	private database!: IDBDatabase;

	public constructor(private readonly databaseName: string, databaseStores?: string[]) {
		this.initDB(databaseStores);
	}

	public closeDatabase(): void {
		this.database.close();
	}

	public createObject<T extends GenericObject>(storeName: string, databaseElement: T): void {
		const transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
		const store = transaction.objectStore(storeName);
		const createRequest = store.add(databaseElement, databaseElement.id);

		createRequest.onerror = () => this.errorHandler(storeName, this.CREATE_OBJECT);
	}

	public getObject(storeName: string, id: number | string, callback: Callback): void {
		const transaction = this.database.transaction(storeName, this.READ_MODE);
		const store = transaction.objectStore(storeName);
		const getRequest = store.get(id);

		getRequest.onerror = () => this.errorHandler(storeName, this.READ_OBJECT);
		
		getRequest.onsuccess = () => {
			if (getRequest.result !== undefined) {
				callback(getRequest.result);
			}
		};
	}

	public getAllObjects<C extends Function>(storeName: string, callback: C): void {
		const transaction = this.database.transaction(storeName, this.READ_MODE);
		const store = transaction.objectStore(storeName);
		const getAllRequest = store.getAll();

		getAllRequest.onsuccess = () => callback(getAllRequest.result);
		getAllRequest.onerror = () => this.errorHandler(storeName, this.READ_OBJECT);
	}

	public deleteObject(storeName: string, id: number | string): void {
		const transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
		const store = transaction.objectStore(storeName);
		const addRequest = store.delete(id);

		addRequest.onerror = () => this.errorHandler(storeName, this.DELETE_OBJECT);
	}

	public editObject<T extends GenericObject>(storeName: string, databaseElement: T): void {
		const transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
		const store = transaction.objectStore(storeName);
		const updateRequest = store.put(databaseElement, databaseElement.id);

		updateRequest.onerror = () => this.errorHandler(this.databaseName, this.UPDATE_OBJECT);
	}

	public dangerousDropDatabase(): void {
		this.database.close();
		const deleteRequest = this.IndexedDB.deleteDatabase(this.databaseName);

		deleteRequest.onerror = () => this.errorHandler(this.databaseName, this.DELETE_OBJECT);
	}


	private initDB(databaseStores?: string[]): void {
		const openRequest = this.IndexedDB.open(this.databaseName);

		openRequest.onerror = () => console.warn(`Error loading ${this.databaseName} database!`);

		openRequest.onupgradeneeded = () => this.handleOnUpgradeNeeded(openRequest, databaseStores);

		openRequest.onsuccess = () => this.handleOnSuccessOpenRequest(openRequest);
	}

	private readonly errorHandler = (objectName: string, operation: string): void =>
		console.warn(`Error occured during operation: ${operation} for object/id ${objectName}`);

	private handleOnSuccessOpenRequest(openRequest: IDBOpenDBRequest): void {
		this.database = openRequest.result;
		window.dispatchEvent(new CustomEvent(DatabaseManagerEventName));
	}

	private handleOnUpgradeNeeded(openRequest: IDBOpenDBRequest, databaseStores?: string[]): void {
		this.database = openRequest.result;

		if (!databaseStores) {
			return;
		}

		databaseStores.forEach(databaseStore => {
			if (!this.database.objectStoreNames.contains(databaseStore)) {
				this.database.createObjectStore(databaseStore);
			}
		});
	}
}