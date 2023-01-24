import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Message, Producer } from 'kafkajs';
import { KafkajsProducer } from './kafkajs.producer';
import { IProducer } from './producer.interface';

@Injectable()
export class ProducerService implements OnApplicationShutdown {
  // Give the list of all producers in our application with the key being the topic of the producer and the value of the producer
  private readonly producers = new Map<string, IProducer>();
  constructor(private readonly configService: ConfigService) {}
  // boostrap
  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'], // Declare the brokers => server where kafka is listening on
  });
  private readonly producer: Producer = this.kafka.producer();

  async produce(topic: string, message: Message) {
    const producer = await this.getProducer(topic);
    await producer.produce(message);
  }

  private async getProducer(topic: string) {
    let producer = this.producers.get(topic);
    if (!producer) {
      producer = new KafkajsProducer(
        topic,
        this.configService.get('KAFKA_BROKER'),
      );
      await producer.connect();
      this.producers.set(topic, producer);
    }
    return producer;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onApplicationShutdown(signal?: string) {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }
  }
}
