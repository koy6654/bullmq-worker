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

export class TestWorker {
    private pgUtil: PgUtil;

    private redisClient: RedisClient;

    private worker: Worker;

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

        this.worker = new Worker(QUEUES_NAMES.TEST_QUEUE, this._processor.bind(this), workerOptions);
    }

    private _initWorkerListeners() {
        this.worker.on('completed', (job: Job, result: BullMqWorkerHistoryStatus) => {
            handleBullMqWorkerListener(this.pgUtil, job, result, null);
        });

        this.worker.on('failed', (job: Job, err: Error) => {
            handleBullMqWorkerListener(this.pgUtil, job, 'failed', err);
        });
    }

    private async _processor(job: Job): Promise<BullMqWorkerHistoryStatus> {
        let result: BullMqWorkerHistoryStatus = 'completed';

        const executeJob = await isExecuteJobByIdempotency(this.pgUtil, job);
        if (executeJob === false) {
            result = 'skipped';
        } else {
            await sleep(2 * 1000);

            result = 'completed';
        }

        return result;
    }
}
