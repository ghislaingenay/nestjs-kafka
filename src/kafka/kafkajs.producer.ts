import { Logger } from '@nestjs/common';
import { Kafka, Message, Producer } from 'kafkajs';
import { sleep } from 'src/sleep';
import { IProducer } from './producer.interface';

export class KafkajsProducer implements IProducer {
  private readonly kafka: Kafka;
  private producer: Producer;
  private readonly logger: Logger;

  constructor(private readonly topic: string, broker: string) {
    this.kafka = new Kafka({
      brokers: [broker],
    });
    this.producer = this.kafka.producer();
    this.logger = new Logger(topic);
  }

  async produce(message: Message) {
    await this.producer.send({
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
