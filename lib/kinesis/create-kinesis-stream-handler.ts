import { KinesisStreamHandler } from "aws-lambda";
import { kinesisToJson } from "./to-json";

export class TimeoutError extends Error {}

/**
 * Function that can handle a single KinesisStreamRecord
 * @returns void
 * @throws unhandled errors
 */
type KinesisStreamRecordHandler<T> = (record: T) => Promise<void>;

/**
 * Factory Function to create a KinesisStreamHandler that return Partial Failures Responses
 * @returns a KinesisStreamHandler that returns partial failures
 */
type KinesisStreamHandlerFactory = <T>(
  handler: KinesisStreamRecordHandler<T>
) => KinesisStreamHandler;

export const CreateKinesisStreamHandler: KinesisStreamHandlerFactory = <T>(
  handler: KinesisStreamRecordHandler<T>
) => {
  const streamHandler: KinesisStreamHandler = async (event, context) => {
    const successes = new Set<string>();

    const handlers = Promise.allSettled(
      event.Records.map((record) => {
        const data = kinesisToJson<T>(record.kinesis.data);

        return handler(data).then(() => {
          successes.add(record.kinesis.sequenceNumber);
        });
      })
    );

    const timeout = new Promise((resolve) =>
      setTimeout(resolve, context.getRemainingTimeInMillis() - 2000)
    );

    await Promise.race([handlers, timeout]);

    return {
      batchItemFailures: event.Records.filter(
        (record) => !successes.has(record.kinesis.sequenceNumber)
      ).map((record) => ({
        itemIdentifier: record.kinesis.sequenceNumber,
      })),
    };
  };

  return streamHandler;
};
