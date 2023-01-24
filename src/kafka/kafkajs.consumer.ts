import { Logger } from '@nestjs/common';
import {
  Consumer,
  ConsumerConfig,
  ConsumerSubscribeTopics,
  Kafka,
  KafkaMessage,
} from 'kafkajs';
import { sleep } from 'src/sleep';
import { IConsumer } from './consumer.interface';

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
      brokers: [broker],
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
    await this.consumer.subscribe(this.topic);
    // Run our code when we receive a message
    await this.consumer.run({
      eachMessage: async ({ partition, message }) => {
        this.logger.debug(`Processing message partition ${partition}`);
        await onMessage(message);
      },
    });
  }
}
