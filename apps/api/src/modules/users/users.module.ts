import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [PrismaModule],
  providers: [{ provide: USERS_REPOSITORY, useClass: UsersRepository }],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}