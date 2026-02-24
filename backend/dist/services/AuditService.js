"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const knex_1 = __importDefault(require("../config/knex"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class AuditService {
    /**
     * Log an audit event (HIPAA compliant)
     */
    async log(data) {
        try {
            await (0, knex_1.default)('audit_logs').insert({
                id: (0, uuid_1.v4)(),
                user_id: data.user_id,
                action: data.action,
                resource_type: data.resource_type,
                resource_id: data.resource_id,
                details: data.details ? JSON.stringify(data.details) : null,
                ip_address: data.ip_address,
                user_agent: data.user_agent,
                is_phi_access: data.is_phi_access || false,
                created_at: knex_1.default.fn.now(),
            });
            // Also log to application logger for real-time monitoring
            logger_1.logger.info('Audit Log', {
                ...data,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            // Critical: Audit logging must never fail silently
            logger_1.logger.error('CRITICAL: Audit log failed', { error, data });
            // In production, this should trigger an alert
            throw new Error('Audit logging failed');
        }
    }
    /**
     * Get audit logs for a user (compliance requirement)
     */
    async getUserAuditLogs(userId, params = {}) {
        const { start_date, end_date, action, page = 1, limit = 100 } = params;
        const offset = (page - 1) * limit;
        let query = (0, knex_1.default)('audit_logs').where({ user_id: userId });
        if (start_date) {
            query = query.where('created_at', '>=', start_date);
        }
        if (end_date) {
            query = query.where('created_at', '<=', end_date);
        }
        if (action) {
            query = query.where({ action });
        }
        const [total, logs] = await Promise.all([
            query.clone().count('* as count').first(),
            query
                .select('*')
                .orderBy('created_at', 'desc')
                .limit(limit)
                .offset(offset),
        ]);
        return {
            data: logs,
            pagination: {
                page,
                limit,
                total: parseInt(total.count),
                pages: Math.ceil(parseInt(total.count) / limit),
            },
        };
    }
    /**
     * Get PHI access logs (HIPAA requirement)
     */
    async getPHIAccessLogs(resourceType, resourceId, params = {}) {
        const { start_date, end_date, page = 1, limit = 100 } = params;
        const offset = (page - 1) * limit;
        let query = (0, knex_1.default)('audit_logs')
            .where({
            resource_type: resourceType,
            resource_id: resourceId,
            is_phi_access: true,
        })
            .leftJoin('users', 'audit_logs.user_id', 'users.id')
            .select('audit_logs.*', 'users.first_name', 'users.last_name', 'users.email', 'users.role');
        if (start_date) {
            query = query.where('audit_logs.created_at', '>=', start_date);
        }
        if (end_date) {
            query = query.where('audit_logs.created_at', '<=', end_date);
        }
        const [total, logs] = await Promise.all([
            query.clone().count('* as count').first(),
            query.orderBy('audit_logs.created_at', 'desc').limit(limit).offset(offset),
        ]);
        return {
            data: logs,
            pagination: {
                page,
                limit,
                total: parseInt(total.count),
                pages: Math.ceil(parseInt(total.count) / limit),
            },
        };
    }
    /**
     * Export audit logs for compliance reporting
     */
    async exportAuditLogs(params) {
        const { start_date, end_date, user_id, resource_type, is_phi_access } = params;
        let query = (0, knex_1.default)('audit_logs')
            .leftJoin('users', 'audit_logs.user_id', 'users.id')
            .where('audit_logs.created_at', '>=', start_date)
            .where('audit_logs.created_at', '<=', end_date)
            .select('audit_logs.*', 'users.first_name', 'users.last_name', 'users.email', 'users.role');
        if (user_id) {
            query = query.where('audit_logs.user_id', user_id);
        }
        if (resource_type) {
            query = query.where('audit_logs.resource_type', resource_type);
        }
        if (is_phi_access !== undefined) {
            query = query.where('audit_logs.is_phi_access', is_phi_access);
        }
        const logs = await query.orderBy('audit_logs.created_at', 'desc');
        return logs;
    }
    /**
     * Get audit statistics for compliance dashboard
     */
    async getAuditStats(params) {
        const { start_date, end_date } = params;
        const [totalLogs, phiAccessLogs, userBreakdown, actionBreakdown] = await Promise.all([
            // Total audit logs
            (0, knex_1.default)('audit_logs')
                .where('created_at', '>=', start_date)
                .where('created_at', '<=', end_date)
                .count('* as count')
                .first(),
            // PHI access logs
            (0, knex_1.default)('audit_logs')
                .where('created_at', '>=', start_date)
                .where('created_at', '<=', end_date)
                .where('is_phi_access', true)
                .count('* as count')
                .first(),
            // User breakdown
            (0, knex_1.default)('audit_logs')
                .leftJoin('users', 'audit_logs.user_id', 'users.id')
                .where('audit_logs.created_at', '>=', start_date)
                .where('audit_logs.created_at', '<=', end_date)
                .select('users.role')
                .count('* as count')
                .groupBy('users.role'),
            // Action breakdown
            (0, knex_1.default)('audit_logs')
                .where('created_at', '>=', start_date)
                .where('created_at', '<=', end_date)
                .select('action')
                .count('* as count')
                .groupBy('action')
                .orderBy('count', 'desc')
                .limit(10),
        ]);
        return {
            total_logs: parseInt(totalLogs.count),
            phi_access_logs: parseInt(phiAccessLogs.count),
            user_breakdown: userBreakdown,
            top_actions: actionBreakdown,
        };
    }
}
exports.AuditService = AuditService;
