import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  // boostrap
  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'], // Declare the brokers => server where kafka is listening on
  });
  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit() {
    await this.producer.connect(); // connect the producer to the server
  }

  async produce(record: ProducerRecord) {
    await this.producer.send(record); // send the record to the server
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onApplicationShutdown(signal?: string) {
    await this.producer.disconnect(); // disconnect the producer from the server
  }
}
