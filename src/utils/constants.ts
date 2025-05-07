export const BULLMQ_WORKER_PREFIX = 'bullmq-worker';

export const QUEUES_NAMES = {
    TEST_QUEUE: 'test-queue',
    PAYMENT_GATEWAY_QUEUE: 'payment-gateway-queue',
    PROCESS_PAYMENT_QUEUE: 'process-payment-queue',
} as const;

export const JOB_IDS = {
    job1: 'c33c7339-7e2c-51ad-ae40-b29061f5a620',
    job2: '821eed77-1c4d-5bd0-9cc7-7b6b9e5981d4',
    job3: '037630cd-48d0-57af-b193-b61fe5948a19',
    requestPaymentGatewayJob: '14de5cd7-5201-5c26-a060-4c4f81cc33fb',
    pollingPaymentGatewayJob: '208d2ed3-3941-55c0-8c50-62136f3b40b9',
    refundPaymentJob: '9ca93f07-bfa5-533e-bb03-1bfd58da701c',
    expirePaymentJob: '6d550681-897e-50c2-b3ee-69ae9d56eeaf',
} as const;
