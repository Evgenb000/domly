import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface DailyStat {
  date: string;
  count: number;
}

export interface TopProperty {
  id: string;
  title: string;
  viewsCount: number;
  bookingsCount: number;
}

export interface ConversionFunnel {
  totalViews: number;
  totalBookings: number;
  conversionRate: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformCounts() {
    const [totalUsers, totalProperties, totalBookings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.booking.count(),
    ]);
    return { totalUsers, totalProperties, totalBookings };
  }

  async getDailyNewUsers(): Promise<DailyStat[]> {
    return this.prisma.$queryRaw<DailyStat[]>`
      SELECT d::date::text AS date, COUNT(u.id)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') d
      LEFT JOIN users u ON DATE(u."createdAt") = d::date
      GROUP BY d
      ORDER BY d
    `;
  }

  async getDailyNewProperties(): Promise<DailyStat[]> {
    return this.prisma.$queryRaw<DailyStat[]>`
      SELECT d::date::text AS date, COUNT(p.id)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') d
      LEFT JOIN properties p ON DATE(p."createdAt") = d::date
      GROUP BY d
      ORDER BY d
    `;
  }

  async getDailyNewBookings(): Promise<DailyStat[]> {
    return this.prisma.$queryRaw<DailyStat[]>`
      SELECT d::date::text AS date, COUNT(b.id)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') d
      LEFT JOIN bookings b ON DATE(b."createdAt") = d::date
      GROUP BY d
      ORDER BY d
    `;
  }

  async getTopPropertiesByViews(limit: number): Promise<TopProperty[]> {
    return this.prisma.$queryRaw<TopProperty[]>`
      SELECT p.id, p.title, p."viewsCount", COUNT(b.id)::int AS "bookingsCount"
      FROM properties p
      LEFT JOIN bookings b ON b."propertyId" = p.id
      GROUP BY p.id
      ORDER BY p."viewsCount" DESC
      LIMIT ${limit}
    `;
  }

  async getConversionFunnel(): Promise<ConversionFunnel> {
    const [viewsResult, totalBookings] = await Promise.all([
      this.prisma.property.aggregate({ _sum: { viewsCount: true } }),
      this.prisma.booking.count(),
    ]);
    const totalViews = viewsResult._sum.viewsCount ?? 0;
    const conversionRate = totalViews > 0 ? totalBookings / totalViews : 0;
    return { totalViews, totalBookings, conversionRate };
  }
}
