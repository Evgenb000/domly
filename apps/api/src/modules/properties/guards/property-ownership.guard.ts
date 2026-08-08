import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IPropertiesRepository,
  PROPERTIES_REPOSITORY,
} from '../repositories/properties-repository.interface';

@Injectable()
export class PropertyOwnershipGuard implements CanActivate {
  constructor(
    @Inject(PROPERTIES_REPOSITORY)
    private readonly propertiesRepository: IPropertiesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const propertyId = request.params.id;

    if (!propertyId) {
      throw new ForbiddenException('Property id is required');
    }

    const property = await this.propertiesRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    if (property.ownerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this property',
      );
    }

    request.property = property;
    return true;
  }
}
