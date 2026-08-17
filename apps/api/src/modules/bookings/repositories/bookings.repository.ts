import { Injectable } from '@nestjs/common';
import type { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  BookingFilters,
  IBookingsRepository,
  PaginatedBookings,
} from './bookings-repository.interface';

@Injectable()
export class BookingsRepository implements IBookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithPropertyLock(
    propertyId: string,
    userId: string,
  ): Promise<Booking | null> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.property.updateMany({
        where: {
          id: propertyId,
          status: 'AVAILABLE',
        },
        data: { status: 'RESERVED' },
      });

      if (updated.count === 0) {
        return null;
      }

      return tx.booking.create({
        data: {
          status: 'ACTIVE',
          property: { connect: { id: propertyId } },
          user: { connect: { id: userId } },
        },
        include: { property: true },
      });
    });
  }

  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });
  }

  async findManyByUser(
    userId: string,
    filters: BookingFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBookings> {
    const where: Prisma.BookingWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { property: true },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  async updateAutoCancelJobId(id: string, jobId: string): Promise<void> {
    await this.prisma.booking.update({
      where: { id },
      data: { autoCancelJobId: jobId },
    });
  }

  async cancelWithPropertyRelease(
    bookingId: string,
    propertyId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });

      await tx.property.update({
        where: { id: propertyId },
        data: { status: 'AVAILABLE' },
      });
    });
  }

  async expireWithPropertyRelease(
    bookingId: string,
    propertyId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED' },
      });

      await tx.property.update({
        where: { id: propertyId },
        data: { status: 'AVAILABLE' },
      });
    });
  }
}
