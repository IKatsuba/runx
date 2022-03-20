import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from './token.service';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [, token] = (request.header('authorization') ?? '').split(' ');

    const roles = this.reflector.get<Roles[]>('roles', context.getHandler());
    const result = !!token && this.tokenService.validateToken(token, roles);

    console.log(result);

    return result;
  }
}
