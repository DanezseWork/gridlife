import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiWrappedOkResponse } from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Includes nested user settings snapshot.',
  })
  @ApiWrappedOkResponse('Current user profile')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }
}
