import {Queue} from 'bullmq';
import {QUEUES_NAMES} from '../../utils/constants';
import {cleanBullMqJobs, getBullMqQueueOptions} from '../../common/common.service';
import {RedisClient} from '../../vendors/redis/redis';
export class TestQueue {
    private redisClient: RedisClient;

    private queue: Queue;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public async init(): Promise<void> {
        const queueOptions = getBullMqQueueOptions(this.redisClient, {});

        this.queue = new Queue(QUEUES_NAMES.TEST_QUEUE, queueOptions);

        await cleanBullMqJobs(this.queue);
    }

    public getQueue() {
        return this.queue;
    }
}
