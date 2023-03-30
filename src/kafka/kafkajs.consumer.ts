import { Logger } from '@nestjs/common';
import {
  Consumer,
  ConsumerConfig,
  ConsumerSubscribeTopics,
  EachMessagePayload,
  Kafka,
  KafkaMessage,
} from 'kafkajs';
import { sleep } from 'src/sleep';
import { IConsumer } from './consumer.interface';
import * as retry from 'async-retry';

export class KafkajsConsumer implements IConsumer {
  private readonly kafka: Kafka;
  private consumer: Consumer;
  private readonly logger: Logger;

  constructor(
    private readonly topic: ConsumerSubscribeTopics,
    config: ConsumerConfig,
    broker: string,
  ) {
    this.kafka = new Kafka({
      // Therefore the clientId should be shared across multiple instances in a cluster or horizontally scaled application, but distinct for each application.
      brokers: [broker],
      connectionTimeout: 3000, // Time in milliseconds to wait for a successful connection
      requestTimeout: 25000, // Time in milliseconds to wait for a successful request.
    });
    this.consumer = this.kafka.consumer(config);
    this.logger = new Logger(`${topic.topics}-${config.groupId}`);
  }

  async connect(): Promise<void> {
    // Retrieve connection even if it's fail
    try {
      await this.consumer.connect(); // Try 5 times and if not working => throw an error
    } catch (err) {
      this.logger.error('failed to connect to kafka', err);
      await sleep(5000);
      await this.connect();
    }
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  async consume(
    onMessage: (message: KafkaMessage) => Promise<void>,
  ): Promise<void> {
    await this.connect();

    await this.consumer.subscribe(this.topic);
    // Run our code when we receive a message
    await this.consumer.run({
      eachMessage: async (messagePayload: EachMessagePayload) => {
        const { topic, partition, message } = messagePayload;
        const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
        this.logger.debug(`- ${prefix} ${message.key}#${message.value}`);
        try {
          await retry(async () => onMessage(message), {
            retries: 3,
            onRetry: (err, attempt) => {
              this.logger.error(
                `Error consuming message, executing retry ${attempt}/3`,
                err,
              );
            },
          });
        } catch (err) {
          this.logger.error(`Error consuming message, Adding to DQL...`, err);
          await this.addMessagetoDql(message);
        }
      },
    });
  }

  private async addMessagetoDql(message: KafkaMessage) {
    // add inside the db
  }
}
