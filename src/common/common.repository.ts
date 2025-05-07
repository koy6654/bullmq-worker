import {PgUtil} from '../utils/pg-util';
import {BullMqWorkerHistoryStatus} from '../utils/types';
import {v4} from 'uuid';

export async function insertBullMqWorkerHistory(
    pgUtil: PgUtil,
    jobId: string,
    jobName: string,
    queueName: string,
    status: BullMqWorkerHistoryStatus,
): Promise<void> {
    await pgUtil.query<string>(
        `
        INSERT INTO
            bullmq_worker_history
            (
                id,
                job_id,
                job_name,
                queue_name,
                status
            )
        VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
    `,
        [v4(), jobId, jobName, queueName, status],
    );
}

export async function getBullMqWorkerHistoryRecentTime(pgUtil: PgUtil, jobId: string): Promise<Date> {
    const result = await pgUtil.query<{create_time: Date}>(
        `
        SELECT
            create_time
        FROM
            bullmq_worker_history
        WHERE
            job_id = $1 AND
            status = 'completed'
        ORDER BY
            create_time DESC
        LIMIT 1
    `,
        [jobId],
    );

    return result?.create_time;
}
