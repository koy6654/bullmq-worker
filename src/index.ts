import fs from 'fs';
import {TestJob} from './modules/test/test.job';
import {TestWorker} from './modules/test/test.worker';
import {TestQueue} from './modules/test/test.queue';
import yaml from 'js-yaml';
import {Option, program} from 'commander';
import {RedisClient} from './vendors/redis/redis';
import {Config, BullMqWorkerQueues} from './utils/types';
import {PgUtil} from './utils/pg-util';
import {PaymentQueue} from './modules/payment/payment.queue';
import {PaymentJob} from './modules/payment/payment.job';
import {PaymentWorker} from './modules/payment/payment.worker';

import 'source-map-support/register';

function initWorkers(pgUtil: PgUtil, redisClient: RedisClient) {
    const testWorker = new TestWorker(pgUtil, redisClient);
    const paymentWorker = new PaymentWorker(pgUtil, redisClient);

    testWorker.init();
    paymentWorker.init();
}

async function initQueues(redisClient: RedisClient): Promise<BullMqWorkerQueues[]> {
    const testQueue = new TestQueue(redisClient);
    const paymentQueue = new PaymentQueue(redisClient);

    await testQueue.init();
    await paymentQueue.init();

    return [testQueue, paymentQueue];
}

async function initJobs(pgUtil: PgUtil, bullMqWorkerQueues: BullMqWorkerQueues[]): Promise<void> {
    for (const queue of bullMqWorkerQueues) {
        if (queue instanceof TestQueue) {
            const testJob = new TestJob(pgUtil, queue);

            await testJob.init();
        } else if (queue instanceof PaymentQueue) {
            const paymentJob = new PaymentJob(pgUtil, queue);

            await paymentJob.init();
        }
    }
}

async function runBullMqWorker(config: Config) {
    if (config == null) {
        throw new Error('Invalid config for bullmq worker');
    }

    const pgUtil = new PgUtil(config);

    const redisClient = new RedisClient(config);
    redisClient.setMaxListeners(300);

    const bullMqWorkerQueues = await initQueues(redisClient);

    initWorkers(pgUtil, redisClient);

    await initJobs(pgUtil, bullMqWorkerQueues);
}

const entry = async () => {
    program
        .addOption(new Option('-c, --config <config.yml>', 'configuration').default('./config.yml'))
        .parse(process.argv);

    const runtimeOptions = program.opts();
    const configFile = runtimeOptions.config;
    const rawConfig = yaml.load(fs.readFileSync(configFile, 'utf-8'));
    const config = Object.keys(rawConfig)
        .filter((k) => k.match(/^x-/) == null)
        .reduce((acc, k) => {
            acc[k] = rawConfig[k];
            return acc;
        }, {}) as Config;

    await runBullMqWorker(config);
};

process.setMaxListeners(500);
if (process.env.NODE_ENV !== 'test') {
    entry().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
