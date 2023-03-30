import { Logger } from '@nestjs/common';
import { CompressionTypes, Kafka, Message, Producer } from 'kafkajs';
import { sleep } from 'src/sleep';
import { IProducer } from './producer.interface';

export class KafkajsProducer implements IProducer {
  private readonly kafka: Kafka;
  private producer: Producer;
  private readonly logger: Logger;

  constructor(private readonly topic: string, broker: string) {
    this.kafka = new Kafka({
      // Therefore the clientId should be shared across multiple instances in a cluster or horizontally scaled application, but distinct for each application.
      brokers: [broker],
      connectionTimeout: 3000, // Time in milliseconds to wait for a successful connection
      requestTimeout: 25000, // Time in milliseconds to wait for a successful request.
    });
    this.producer = this.kafka.producer({
      transactionalId: 'my-transactional-producer',
      maxInFlightRequests: 1,
      idempotent: true,
    });
    this.logger = new Logger(topic);
  }

  // https://kafka.js.org/docs/transactions

  async produce(message: Message) {
    await this.producer.send({
      compression: CompressionTypes.GZIP,
      topic: this.topic,
      messages: [message],
    });
  }

  async connect() {
    try {
      await this.producer.connect(); // Try 5 times and if not working => throw an error
    } catch (err) {
      this.logger.error('failed to connect to kafka', err);
      await sleep(5000);
      await this.connect();
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
