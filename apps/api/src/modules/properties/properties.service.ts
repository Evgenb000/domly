import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaClient) {}
}
