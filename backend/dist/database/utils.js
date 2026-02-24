"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFromDb = exports.prepareForDb = exports.executeInSerializable = exports.executeInReadCommitted = exports.executeInTransaction = exports.withTransaction = exports.withSorting = exports.withFilters = exports.withPagination = void 0;
const database_1 = require("./database");
const withPagination = (query, page = 1, pageSize = 10) => {
    const offset = (page - 1) * pageSize;
    return query.offset(offset).limit(pageSize);
};
exports.withPagination = withPagination;
const withFilters = (query, filters) => {
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                query.whereIn(key, value);
            }
            else if (typeof value === 'object' && value !== null) {
                // Handle operators like { $gt: 10 }
                Object.entries(value).forEach(([op, opValue]) => {
                    switch (op) {
                        case '$gt':
                            query.where(key, '>', opValue);
                            break;
                        case '$gte':
                            query.where(key, '>=', opValue);
                            break;
                        case '$lt':
                            query.where(key, '<', opValue);
                            break;
                        case '$lte':
                            query.where(key, '<=', opValue);
                            break;
                        case '$ne':
                            query.whereNot(key, opValue);
                            break;
                        case '$like':
                            query.where(key, 'like', `%${opValue}%`);
                            break;
                        case '$ilike':
                            query.whereILike(key, `%${opValue}%`);
                            break;
                        case '$between':
                            if (Array.isArray(opValue) && opValue.length === 2) {
                                query.whereBetween(key, opValue);
                            }
                            break;
                    }
                });
            }
            else {
                query.where(key, value);
            }
        }
    });
    return query;
};
exports.withFilters = withFilters;
const withSorting = (query, sortBy, sortOrder = 'asc') => {
    if (sortBy) {
        return query.orderBy(sortBy, sortOrder);
    }
    return query;
};
exports.withSorting = withSorting;
const withTransaction = async (callback, options) => {
    const knex = (0, database_1.getKnex)();
    return await knex.transaction(async (trx) => {
        if (options === null || options === void 0 ? void 0 : options.isolationLevel) {
            await trx.raw(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
        }
        return await callback(trx);
    });
};
exports.withTransaction = withTransaction;
const executeInTransaction = async (callback, options) => {
    return (0, exports.withTransaction)(callback, options);
};
exports.executeInTransaction = executeInTransaction;
const executeInReadCommitted = async (callback) => {
    return (0, exports.withTransaction)(callback, { isolationLevel: 'READ COMMITTED' });
};
exports.executeInReadCommitted = executeInReadCommitted;
const executeInSerializable = async (callback) => {
    return (0, exports.withTransaction)(callback, { isolationLevel: 'SERIALIZABLE' });
};
exports.executeInSerializable = executeInSerializable;
// Helper function to handle JSON fields
const parseJsonField = (data, fields) => {
    if (!data)
        return data;
    const result = { ...data };
    fields.forEach(field => {
        if (result[field] && typeof result[field] === 'string') {
            try {
                result[field] = JSON.parse(result[field]);
            }
            catch (e) {
                // If parsing fails, keep the original value
                console.warn(`Failed to parse JSON field ${field}:`, e);
            }
        }
    });
    return result;
};
// Helper function to stringify JSON fields before saving
const prepareForDb = (data, jsonFields) => {
    if (!data)
        return data;
    const result = { ...data };
    jsonFields.forEach(field => {
        if (result[field] !== undefined && result[field] !== null) {
            if (typeof result[field] === 'object') {
                result[field] = JSON.stringify(result[field]);
            }
        }
    });
    return result;
};
exports.prepareForDb = prepareForDb;
const parseFromDb = (data, jsonFields = []) => {
    if (Array.isArray(data)) {
        return data.map(item => parseJsonField(item, jsonFields));
    }
    return parseJsonField(data, jsonFields);
};
exports.parseFromDb = parseFromDb;
