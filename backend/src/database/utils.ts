import { Knex } from 'knex';
import { getKnex } from './database';
import logger from '../utils/logger';

type QueryBuilder = Knex.QueryBuilder<any, any>;

export const withPagination = <T>(
  query: QueryBuilder,
  page: number = 1,
  pageSize: number = 10
): QueryBuilder => {
  const offset = (page - 1) * pageSize;
  return query.offset(offset).limit(pageSize);
};

export const withFilters = (
  query: QueryBuilder,
  filters: Record<string, any>
): QueryBuilder => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query.whereIn(key, value);
      } else if (typeof value === 'object' && value !== null) {
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
      } else {
        query.where(key, value);
      }
    }
  });
  return query;
};

export const withSorting = (
  query: QueryBuilder,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): QueryBuilder => {
  if (sortBy) {
    return query.orderBy(sortBy, sortOrder);
  }
  return query;
};

export const withTransaction = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>,
  options?: { isolationLevel?: string }
): Promise<T> => {
  const knex = getKnex();
  return await knex.transaction(async (trx) => {
    if (options?.isolationLevel) {
      await trx.raw(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }
    return await callback(trx);
  });
};

export const executeInTransaction = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>,
  options?: { isolationLevel?: string }
): Promise<T> => {
  return withTransaction(callback, options);
};

export const executeInReadCommitted = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> => {
  return withTransaction(callback, { isolationLevel: 'READ COMMITTED' });
};

export const executeInSerializable = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> => {
  return withTransaction(callback, { isolationLevel: 'SERIALIZABLE' });
};

// Helper function to handle JSON fields
const parseJsonField = (data: any, fields: string[]): any => {
  if (!data) return data;
  
  const result = { ...data };
  
  fields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        // If parsing fails, keep the original value
        logger.warn('Failed to parse JSON field', { service: 'database-utils', field, error: e.message });
      }
    }
  });
  
  return result;
};

// Helper function to stringify JSON fields before saving
export const prepareForDb = (data: any, jsonFields: string[]): any => {
  if (!data) return data;
  
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

export const parseFromDb = <T>(data: any, jsonFields: string[] = []): T => {
  if (Array.isArray(data)) {
    return data.map(item => parseJsonField(item, jsonFields)) as unknown as T;
  }
  return parseJsonField(data, jsonFields) as T;
};
