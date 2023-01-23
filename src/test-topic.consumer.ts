import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from './kafka/consumer.service';

@Injectable()
export class TestTopicConsumer implements OnModuleInit {
  constructor(private readonly consumerService: ConsumerService) {}
  async consume(message: any) {
    console.log(message);
  }

  async onModuleInit() {
    await this.consumerService.consume(
      { topic: 'test-topic' },
      {
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            value: message.value.toString(),
            topic: topic.toString(),
            partition: partition.toString(),
          });
        },
      },
    ); // eachMessage: code run when a message is received in this topic
  }
}
