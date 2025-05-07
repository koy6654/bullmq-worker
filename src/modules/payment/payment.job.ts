import {Queue} from 'bullmq';
import {PaymentQueue} from './payment.queue';
import {PgUtil} from '../../utils/pg-util';
import {JOB_IDS} from '../../utils/constants';
import {BullMqWorkerJobMessage} from '../../utils/types';
import {handleAddJobError, getBullMqJobOptions} from '../../common/common.service';
import {insertBullMqWorkerHistory} from '../../common/common.repository';

export class PaymentJob {
    pgUtil: PgUtil;

    paymentGatewayQueue: Queue;

    processPaymentQueue: Queue;

    constructor(pgUtil: PgUtil, paymentQueue: PaymentQueue) {
        this.pgUtil = pgUtil;

        this.paymentGatewayQueue = paymentQueue.getPaymentGatewayQueue();
        this.processPaymentQueue = paymentQueue.getProcessPaymentQueue();
    }

    public async init(): Promise<void> {
        await Promise.all([
            this.requestPaymentGatewayJob(),
            this.pollingPaymentGatewayJob(),
            this.refundPaymentJob(),
            this.expirePaymentJob(),
        ]);
    }

    @handleAddJobError()
    public async requestPaymentGatewayJob() {
        const jobName = 'requestPaymentGatewayJob';
        const jobId = JOB_IDS[jobName];
        const queueName = this.paymentGatewayQueue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage: BullMqWorkerJobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *',
                immediately: false,
            },
        });

        await this.paymentGatewayQueue.add(jobName, jobMessage, jobOptions);
    }

    @handleAddJobError()
    public async pollingPaymentGatewayJob() {
        const jobName = 'pollingPaymentGatewayJob';
        const jobId = JOB_IDS[jobName];
        const queueName = this.paymentGatewayQueue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,10,20,30,40,50 * * * * *',
                immediately: false,
            },
        });

        await this.paymentGatewayQueue.add(jobName, jobMessage, jobOptions);
    }

    @handleAddJobError()
    public async refundPaymentJob() {
        const jobName = 'refundPaymentJob';
        const jobId = JOB_IDS[jobName];
        const queueName = this.processPaymentQueue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *',
                immediately: false,
            },
        });

        await this.processPaymentQueue.add(jobName, jobMessage, jobOptions);
    }

    @handleAddJobError()
    public async expirePaymentJob() {
        const jobName = 'expirePaymentJob';
        const jobId = JOB_IDS[jobName];
        const queueName = this.processPaymentQueue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *',
                immediately: false,
            },
        });

        await this.processPaymentQueue.add(jobName, jobMessage, jobOptions);
    }
}
