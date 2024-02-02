import { CreateKinesisStreamHandler } from "./lib/kinesis/create-kinesis-stream-handler";

interface MyAction {
  command: "send";
  payload: string;
  shouldThrow: boolean; // for experimenting and confirming behavior
}

export const handler = CreateKinesisStreamHandler<MyAction>(async (action) => {
  const { shouldThrow } = action;
  try {
    if (shouldThrow) {
      throw new Error(JSON.stringify({ message: "Test Error" }));
    }
    return undefined;
  } catch (error) {
    // this has custom error handling, that could not handle this error
    console.error({ action, error });
    throw error;
  }
});
