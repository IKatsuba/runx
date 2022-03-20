import { SetMetadata } from '@nestjs/common';

export const enum Roles {
  write,
  read,
}

export const SetRoles = (...roles: Roles[]) => SetMetadata('roles', roles);
