import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from './kafka/consumer.service';

// This is the consumer for the test-topic topic name
@Injectable()
export class TestTopicConsumer implements OnModuleInit {
  constructor(private readonly consumerService: ConsumerService) {}
  async consume(message: any) {
    console.log(message);
  }

  async onModuleInit() {
    // all consumers inside a consumer group with the same group Id will be consuming from a given topic amoongst n number of partitions => partitions will be distributed to all memebers inside this particular group
    await this.consumerService.consume({
      topic: { topics: ['test-topic'], fromBeginning: true },
      config: { groupId: 'test-consumer' },
      onMessage: async (message) => {
        console.log(message.value.toString());
      },
    });
    // eachMessage: code run when a message is received in this topic
  }
}
