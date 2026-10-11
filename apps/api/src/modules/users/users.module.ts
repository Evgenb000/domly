import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
    UsersService,
  ],
  exports: [USERS_REPOSITORY, UsersService],
})
export class UsersModule {}
