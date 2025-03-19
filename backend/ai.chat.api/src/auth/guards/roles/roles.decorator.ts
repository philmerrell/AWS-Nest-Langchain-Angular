import { SetMetadata } from '@nestjs/common';
export enum Role {
    DotNetDevelopers = 'DotNetDevelopers',
    Test = 'test'
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);