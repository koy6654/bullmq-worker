import {PaymentQueue} from 'src/modules/payment/payment.queue';
import {TestQueue} from '../modules/test/test.queue';

export type Config = {
    bullmqWorkerConfig: {
        pgConfig: {
            host: string;
            port: number;
            user: string;
            password: string;
            database: string;
            max: number;
            idleTimeoutMillis: number;
            connectionTimeoutMillis: number;
        };
        redisConfig: {
            host: string;
            port: number;
            retry_timeout: number;
        };
    };
};

export type BullMqWorkerJobMessage = {
    jobId: string;
    ignoreIdempotency?: boolean;
};

export type BullMqWorkerQueues = TestQueue | PaymentQueue;

export type BullMqWorkerHistoryStatus = 'init' | 'skipped' | 'completed' | 'failed';
