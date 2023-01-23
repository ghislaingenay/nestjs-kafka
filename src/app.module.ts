import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { TestTopicConsumer } from './test-topic.consumer';

@Module({
  imports: [KafkaModule],
  controllers: [AppController],
  providers: [AppService, TestTopicConsumer],
})
export class AppModule {}
