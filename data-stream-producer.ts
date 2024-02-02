import {
  KinesisClient,
  PutRecordsCommand,
  PutRecordsCommandInput,
} from "@aws-sdk/client-kinesis";
import { nanoid } from "nanoid";

const encode = (json: string) => new Uint8Array(Buffer.from(json));

export const handler = async () => {
  const client = new KinesisClient({ region: "us-east-1" });

  const Records = [...Array(20)].map((_, i) => ({
    Data: encode(
      JSON.stringify({
        command: "send",
        shouldThrow: i + 1 === 9 ? true : false, // for experimenting and confirming behavior
        payload: i + 1,
      })
    ),
    PartitionKey: nanoid(),
  }));

  const input: PutRecordsCommandInput = {
    Records,
    StreamName: "serverless-playground-dev-DataStream-kDJSZepy6ywN",
    StreamARN:
      "arn:aws:kinesis:us-east-1:327732143687:stream/serverless-playground-dev-DataStream-kDJSZepy6ywN",
  };
  const command = new PutRecordsCommand(input);

  await client.send(command);

  return {
    statusCode: 202,
  };
};
