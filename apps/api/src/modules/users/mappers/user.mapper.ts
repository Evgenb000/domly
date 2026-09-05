import type { UserResponseDto } from '@domly/shared';
import type { User } from '@prisma/client';

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
  };
}
