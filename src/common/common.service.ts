import {BULLMQ_WORKER_PREFIX, JOB_IDS} from '../utils/constants';
import {RedisClient} from '../vendors/redis/redis';
import {Job, JobsOptions, Queue, QueueOptions, WorkerOptions} from 'bullmq';
import type {DateType} from 'cron-parser';
import {parseExpression} from 'cron-parser';
import {PgUtil} from '../utils/pg-util';
import {getBullMqWorkerHistoryRecentTime, insertBullMqWorkerHistory} from './common.repository';
import dayjs from 'dayjs';
import {BullMqWorkerHistoryStatus} from '../utils/types';

export function getBullMqJobOptions(overwriteJobOptions: JobsOptions): JobsOptions {
    const defaultJobOptions: JobsOptions = {
        attempts: 5, // 5회 재시도
        backoff: {
            type: 'exponential',
            delay: 1 * 1000, // 1초
        },
        removeOnComplete: {
            age: 60 * 60, // 1시간 뒤 자동 삭제
            count: 5, // 최대 15개까지 보관
        },
        removeOnFail: {
            age: 60 * 60, // 1시간 뒤 자동 삭제
            count: 5, // 최대 15개까지 보관
        },
    };

    const result = {
        ...defaultJobOptions,
        ...overwriteJobOptions,
    };

    return result;
}

export function getBullMqQueueOptions(redisClient: RedisClient, overwriteQueueOptions: QueueOptions): QueueOptions {
    const defaultQueueOptions: QueueOptions = {
        connection: redisClient,
        prefix: BULLMQ_WORKER_PREFIX,
    };

    const result = {
        ...defaultQueueOptions,
        ...overwriteQueueOptions,
    };

    return result;
}

export function getBullMqWorkerOptions(redisClient: RedisClient, overwriteWorkerOptions: WorkerOptions): WorkerOptions {
    const defaultWorkerOptions: WorkerOptions = {
        connection: redisClient,
        prefix: BULLMQ_WORKER_PREFIX,
        concurrency: 1,
    };

    const result = {
        ...defaultWorkerOptions,
        ...overwriteWorkerOptions,
    };

    return result;
}

export async function handleBullMqWorkerListener(
    pgUtil: PgUtil,
    job: Job,
    status: BullMqWorkerHistoryStatus,
    err: Error | null,
): Promise<void> {
    const jobId = getBullMqJobIdFromMessage(job);
    const jobName = job.name;
    const queueName = job.queueName;

    await insertBullMqWorkerHistory(pgUtil, jobId, jobName, queueName, status);

    const now = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    console.info(`${now} ${job.name} ${status}`);
    if (err != null) {
        console.error(err);
    }
}

export function handleAddJobError() {
    return function (_: any, __: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function () {
            try {
                return await originalMethod.apply(this, []);
            } catch (err) {
                console.error(err);
                throw new Error('66de39fa-b0cf-581f-ad75-547e126f1b67');
            }
        };

        return;
    };
}

export async function cleanBullMqJobs(queue: Queue): Promise<void> {
    try {
        await queue.pause();

        await queue.obliterate({force: true});

        await queue.resume();

        console.info(`BullMQ Queue ${queue.name} cleaned`);
    } catch (err) {
        console.error(err);
        throw new Error('20d021fd-9308-507e-999a-4ab66d0a1ede');
    }
}

function getBullMqJobIdFromMessage(job: Job): string {
    const jobId = job.data?.jobId;
    if (jobId == null) {
        throw new Error('8ce046b0-c585-57ea-8cd6-9f3d0a57a317');
    }

    const checkJobIdExist = Object.values(JOB_IDS).some((id) => id === jobId);
    if (checkJobIdExist === false) {
        throw new Error('bf6f06de-e62a-5dc9-a837-c7a6be14d5ee');
    }

    return jobId;
}

export async function isExecuteJobByIdempotency(pgUtil: PgUtil, job: Job): Promise<boolean> {
    const jobId = getBullMqJobIdFromMessage(job);

    let executeIdempotency = true;

    // Job이 Processor에 의해 실행 시작된 시간
    const jobProcessedOn = job?.processedOn;
    if (jobProcessedOn == null) {
        throw new Error('b8b57b4b-17be-5cbf-99f5-1606f4e2ab89');
    }

    // Job의 반복 주기
    const jobRepeatPattern = job.opts?.repeat?.pattern;
    if (jobRepeatPattern == null) {
        throw new Error('56a51cee-2017-5b5e-8c29-d3c6939eff95');
    }

    // Job이 가장 최근 완료된 시간
    const recentCompletedTime = await getBullMqWorkerHistoryRecentTime(pgUtil, jobId);
    if (recentCompletedTime != null) {
        // Job이 가장 최근 완료된 시간 + Job의 반복 주기 + 시스템 오차(1초)를 통해 현재 Job이 실행되어야 하는 시간을 구함
        let nextExecuteTime = getNextExecuteTime(jobRepeatPattern, recentCompletedTime);
        nextExecuteTime = dayjs(nextExecuteTime).subtract(1, 'seconds').toDate();

        // Processor 실행 시간이 현재 Job이 실행되어야 하는 시간보다 크면 작업은 실행한다.
        executeIdempotency = dayjs(jobProcessedOn).isAfter(nextExecuteTime);
    } else {
        executeIdempotency = true;
    }

    return executeIdempotency;
}

export function getNextExecuteTime(pattern: string, createTime: DateType | null): Date {
    try {
        const interval = parseExpression(pattern, {currentDate: createTime});

        return interval.next().toDate();
    } catch (err) {
        console.error('66c7c0be-cc26-5647-9cf9-8a942df921ea', err);
        throw err;
    }
}
