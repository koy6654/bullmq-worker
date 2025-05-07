import {Pool, PoolClient} from 'pg';
import {Config} from './types';

export class PgUtil {
    private pool: Pool;

    constructor(config: Config) {
        this.pool = new Pool({
            host: config.bullmqWorkerConfig.pgConfig.host || 'localhost',
            port: config.bullmqWorkerConfig.pgConfig.port || 5432,
            user: config.bullmqWorkerConfig.pgConfig.user || 'postgres',
            password: config.bullmqWorkerConfig.pgConfig.password,
            database: config.bullmqWorkerConfig.pgConfig.database || 'postgres',
            max: config.bullmqWorkerConfig.pgConfig.max || 10,
            idleTimeoutMillis: config.bullmqWorkerConfig.pgConfig.idleTimeoutMillis || 10 * 1000,
            connectionTimeoutMillis: config.bullmqWorkerConfig.pgConfig.connectionTimeoutMillis || 5 * 1000,
        });
    }

    async query<T>(query: string, params?: any[]): Promise<T> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            if (result.rows.length === 0) {
                return null;
            } else if (result.rows.length === 1) {
                return result.rows[0];
            } else {
                return result.rows;
            }
        } catch (err) {
            console.error('0449669b-fbad-56e5-8814-cb8b4512fc45', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');

            return result;
        } catch (err) {
            await client.query('ROLLBACK');

            console.error('80a2676e-a255-5cfa-878a-a2c0760e14a8', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
