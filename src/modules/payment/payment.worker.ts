import {Worker, Job} from 'bullmq';
import {PgUtil} from '../../utils/pg-util';
import {RedisClient} from '../../vendors/redis/redis';
import {QUEUES_NAMES} from '../../utils/constants';
import {sleep} from '../../utils/base.util';
import {
    getBullMqWorkerOptions,
    handleBullMqWorkerListener,
    isExecuteJobByIdempotency,
} from '../../common/common.service';
import {BullMqWorkerHistoryStatus} from '../../utils/types';

export class PaymentWorker {
    private pgUtil: PgUtil;

    private redisClient: RedisClient;

    private paymentGatewayWorker: Worker;
    private processPaymentWorker: Worker;

    constructor(pgUtil: PgUtil, redisClient: RedisClient) {
        this.pgUtil = pgUtil;

        this.redisClient = redisClient;
    }

    public init() {
        this._initWorkers();
        this._initWorkerListeners();
    }

    private _initWorkers() {
        const workerOptions = getBullMqWorkerOptions(this.redisClient, {});

        this.paymentGatewayWorker = new Worker(
            QUEUES_NAMES.PAYMENT_GATEWAY_QUEUE,
            this._paymentGatewayProcessor.bind(this),
            workerOptions,
        );

        this.processPaymentWorker = new Worker(
            QUEUES_NAMES.PROCESS_PAYMENT_QUEUE,
            this._processPaymentProcessor.bind(this),
            workerOptions,
        );
    }

    private _initWorkerListeners() {
        this.paymentGatewayWorker.on('completed', (job: Job, result: BullMqWorkerHistoryStatus) => {
            handleBullMqWorkerListener(this.pgUtil, job, result, null);
        });
        this.paymentGatewayWorker.on('failed', (job: Job, err: Error) => {
            handleBullMqWorkerListener(this.pgUtil, job, 'failed', err);
        });
        this.processPaymentWorker.on('completed', (job: Job, result: BullMqWorkerHistoryStatus) => {
            handleBullMqWorkerListener(this.pgUtil, job, result, null);
        });
        this.processPaymentWorker.on('failed', (job: Job, err: Error) => {
            handleBullMqWorkerListener(this.pgUtil, job, 'failed', err);
        });
    }

    private async _paymentGatewayProcessor(job: Job): Promise<BullMqWorkerHistoryStatus> {
        let result: BullMqWorkerHistoryStatus = 'completed';

        const executeJob = await isExecuteJobByIdempotency(this.pgUtil, job);
        if (executeJob === false) {
            result = 'skipped';
        } else {
            const jobName = job.name;
            switch (jobName) {
                case 'requestPaymentGatewayJob':
                    await sleep(2 * 1000);
                    break;
                case 'pollingPaymentGatewayJob':
                    await sleep(2 * 1000);
                    break;
            }

            result = 'completed';
        }

        return result;
    }

    private async _processPaymentProcessor(job: Job): Promise<BullMqWorkerHistoryStatus> {
        let result: BullMqWorkerHistoryStatus = 'completed';

        const executeJob = await isExecuteJobByIdempotency(this.pgUtil, job);
        if (executeJob === false) {
            result = 'skipped';
        } else {
            const jobName = job.name;
            switch (jobName) {
                case 'refundPaymentJob':
                    await sleep(2 * 1000);
                    break;
                case 'expirePaymentJob':
                    await sleep(2 * 1000);
                    break;
            }

            result = 'completed';
        }

        return result;
    }
}
