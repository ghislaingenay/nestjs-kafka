import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConsumer } from './consumer.interface';
import { IKafkaJsConsumerOptions } from './kafkajs-consumer-options.interface';
import { KafkajsConsumer } from './kafkajs.consumer';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly consumers: IConsumer[] = []; // wants only one producer and listen to multiple consumers

  // Need to add the connection to the .env file
  constructor(private readonly configService: ConfigService) {}

  async consume({ topic, config, onMessage }: IKafkaJsConsumerOptions) {
    const consumer = new KafkajsConsumer(
      topic,
      config,
      this.configService.get('KAFKA_BROKER'),
    );
    await consumer.connect();
    // consume method to listen to messages
    await consumer.consume(onMessage);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
