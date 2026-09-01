import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminPropertyQuerySchema,
  AdminUserQuerySchema,
  UpdateModerationStatusSchema,
  UpdateUserRoleSchema,
  SetUserBlockedSchema,
  type AdminPropertyQueryDto,
  type AdminUserQueryDto,
  type UpdateModerationStatusDto,
  type UpdateUserRoleDto,
  type SetUserBlockedDto,
} from '@domly/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findUsers(
    @Query(new ZodValidationPipe(AdminUserQuerySchema))
    query: AdminUserQueryDto,
  ) {
    return this.adminService.findUsers(query);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserRoleSchema)) dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.adminService.updateUserRole(id, currentUser.id, dto.role);
  }

  @Patch('users/:id/block')
  async setUserBlocked(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetUserBlockedSchema)) dto: SetUserBlockedDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.adminService.setUserBlocked(id, currentUser.id, dto.isBlocked);
  }

  @Get('properties')
  async findProperties(
    @Query(new ZodValidationPipe(AdminPropertyQuerySchema))
    query: AdminPropertyQueryDto,
  ) {
    return this.adminService.findProperties(query);
  }

  @Patch('properties/:id/moderation')
  async updatePropertyModeration(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateModerationStatusSchema))
    dto: UpdateModerationStatusDto,
  ) {
    return this.adminService.updatePropertyModeration(id, dto.moderationStatus);
  }
}
