var DatabaseManager = /** @class */ (function () {
    function DatabaseManager(databaseName, databaseStores) {
        this.databaseName = databaseName;
        this.CREATE_OBJECT = 'create';
        this.DELETE_OBJECT = 'delete';
        this.READ_OBJECT = 'read';
        this.READ_MODE = 'readonly';
        this.READ_WRITE_MODE = 'readwrite';
        this.UPDATE_OBJECT = 'update';
        this.IndexedDB = window.indexedDB;
        this.errorHandler = function (objectName, operation) {
            return console.warn("Error occured during operation: " + operation + " for object/id " + objectName);
        };
        this.initDB(databaseStores);
    }
    DatabaseManager.prototype.closeDatabase = function () {
        this.database.close();
    };
    DatabaseManager.prototype.createObject = function (storeName, databaseElement) {
        var _this = this;
        var transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
        var store = transaction.objectStore(storeName);
        var createRequest = store.add(databaseElement, databaseElement.id);
        createRequest.onerror = function () { return _this.errorHandler(storeName, _this.CREATE_OBJECT); };
    };
    DatabaseManager.prototype.getObject = function (storeName, id, callback) {
        var _this = this;
        var transaction = this.database.transaction(storeName, this.READ_MODE);
        var store = transaction.objectStore(storeName);
        var getRequest = store.get(id);
        getRequest.onerror = function () { return _this.errorHandler(storeName, _this.READ_OBJECT); };
        getRequest.onsuccess = function () {
            if (getRequest.result !== undefined) {
                callback(getRequest.result);
            }
        };
    };
    DatabaseManager.prototype.getAllObjects = function (storeName, callback) {
        var _this = this;
        var transaction = this.database.transaction(storeName, this.READ_MODE);
        var store = transaction.objectStore(storeName);
        var getAllRequest = store.getAll();
        getAllRequest.onsuccess = function () { return callback(getAllRequest.result); };
        getAllRequest.onerror = function () { return _this.errorHandler(storeName, _this.READ_OBJECT); };
    };
    DatabaseManager.prototype.deleteObject = function (storeName, id) {
        var _this = this;
        var transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
        var store = transaction.objectStore(storeName);
        var addRequest = store["delete"](id);
        addRequest.onerror = function () { return _this.errorHandler(storeName, _this.DELETE_OBJECT); };
    };
    DatabaseManager.prototype.editObject = function (storeName, databaseElement) {
        var _this = this;
        var transaction = this.database.transaction(storeName, this.READ_WRITE_MODE);
        var store = transaction.objectStore(storeName);
        var updateRequest = store.put(databaseElement, databaseElement.id);
        updateRequest.onerror = function () { return _this.errorHandler(_this.databaseName, _this.UPDATE_OBJECT); };
    };
    DatabaseManager.prototype.dangerousDropDatabase = function () {
        var _this = this;
        this.database.close();
        var deleteRequest = this.IndexedDB.deleteDatabase(this.databaseName);
        deleteRequest.onerror = function () { return _this.errorHandler(_this.databaseName, _this.DELETE_OBJECT); };
    };
    DatabaseManager.prototype.initDB = function (databaseObjects) {
        var _this = this;
        var openRequest = this.IndexedDB.open(this.databaseName);
        openRequest.onerror = function () { return console.warn("Error loading " + _this.databaseName + " database!"); };
        openRequest.onupgradeneeded = function () { return _this.handleOnUpgradeNeeded(openRequest, databaseObjects); };
        openRequest.onsuccess = function () { return _this.handleOnSuccessOpenRequest(openRequest); };
    };
    DatabaseManager.prototype.handleOnSuccessOpenRequest = function (openRequest) {
        this.database = openRequest.result;
    };
    DatabaseManager.prototype.handleOnUpgradeNeeded = function (openRequest, databaseStores) {
        var _this = this;
        this.database = openRequest.result;
        if (!databaseStores) {
            return;
        }
        databaseStores.forEach(function (databaseStore) {
            if (!_this.database.objectStoreNames.contains(databaseStore)) {
                _this.database.createObjectStore(databaseStore);
            }
        });
    };
    return DatabaseManager;
}());