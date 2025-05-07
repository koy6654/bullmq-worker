import {Queue} from 'bullmq';
import {QUEUES_NAMES} from '../../utils/constants';
import {cleanBullMqJobs, getBullMqQueueOptions} from '../../common/common.service';
import {RedisClient} from '../../vendors/redis/redis';
export class PaymentQueue {
    private redisClient: RedisClient;

    private paymentGatewayQueue: Queue;

    private processPaymentQueue: Queue;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public async init(): Promise<void> {
        const queueOptions = getBullMqQueueOptions(this.redisClient, {});

        this.paymentGatewayQueue = new Queue(QUEUES_NAMES.PAYMENT_GATEWAY_QUEUE, queueOptions);
        this.processPaymentQueue = new Queue(QUEUES_NAMES.PROCESS_PAYMENT_QUEUE, queueOptions);

        await cleanBullMqJobs(this.paymentGatewayQueue);
        await cleanBullMqJobs(this.processPaymentQueue);
    }

    public getPaymentGatewayQueue() {
        return this.paymentGatewayQueue;
    }

    public getProcessPaymentQueue() {
        return this.processPaymentQueue;
    }
}
