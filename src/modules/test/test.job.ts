import {Queue} from 'bullmq';
import {TestQueue} from './test.queue';
import {PgUtil} from '../../utils/pg-util';
import {JOB_IDS} from '../../utils/constants';
import {BullMqWorkerJobMessage} from '../../utils/types';
import {handleAddJobError, getBullMqJobOptions} from '../../common/common.service';
import {insertBullMqWorkerHistory} from '../../common/common.repository';

export class TestJob {
    pgUtil: PgUtil;

    queue: Queue;

    constructor(pgUtil: PgUtil, testQueue: TestQueue) {
        this.pgUtil = pgUtil;

        this.queue = testQueue.getQueue();
    }

    public async init(): Promise<void> {
        await Promise.all([this.job1(), this.job2(), this.job3()]);
    }

    @handleAddJobError()
    public async job1() {
        const jobName = 'job1';
        const jobId = JOB_IDS[jobName];
        const queueName = this.queue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage: BullMqWorkerJobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *',
                immediately: false,
            },
        });

        await this.queue.add(jobName, jobMessage, jobOptions);
    }

    @handleAddJobError()
    public async job2() {
        const jobName = 'job2';
        const jobId = JOB_IDS[jobName];
        const queueName = this.queue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,10,20,30,40,50 * * * * *',
                immediately: false,
            },
        });

        await this.queue.add(jobName, jobMessage, jobOptions);
    }

    @handleAddJobError()
    public async job3() {
        const jobName = 'job3';
        const jobId = JOB_IDS[jobName];
        const queueName = this.queue.name;

        await insertBullMqWorkerHistory(this.pgUtil, jobId, jobName, queueName, 'init');

        const jobMessage = {jobId};
        const jobOptions = getBullMqJobOptions({
            jobId,
            repeat: {
                pattern: '0,20,40 * * * * *',
                immediately: false,
            },
        });

        await this.queue.add(jobName, jobMessage, jobOptions);
    }
}
