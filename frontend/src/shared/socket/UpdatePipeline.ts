import {logger} from '../utils/logger';

type UpdateTask<T> = () => Promise<T>;

class UpdatePipeline {
    private taskQueue: UpdateTask<unknown>[] = [];
    private isProcessing = false;

    public enqueue<T>(task: UpdateTask<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.taskQueue.push(() => task().then(resolve as (value: unknown) => void).catch(reject));
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    logger.errorLog('Error processing update task:', error);
                }
            }
        }

        this.isProcessing = false;
    }
}

export const updatePipeline = new UpdatePipeline();
