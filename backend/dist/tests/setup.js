"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const test_utils_1 = require("./test-utils");
// Global test setup
beforeAll(async () => {
    // Initialize test database connection
    await data_source_1.AppDataSource.initialize();
    // Run migrations for test database
    await data_source_1.AppDataSource.runMigrations();
});
// Clean up after each test
afterEach(async () => {
    // Clear all test data
    await (0, test_utils_1.clearDatabase)();
});
// Clean up after all tests
afterAll(async () => {
    // Close the database connection
    await (0, test_utils_1.closeTestConnection)();
});
// Set test timeout to 30 seconds
jest.setTimeout(30000);
