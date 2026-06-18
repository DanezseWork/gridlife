import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiWrappedOkResponse } from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch()
  @ApiOperation({
    summary: 'Update user settings',
    description: 'Update theme colors and default currency.',
  })
  @ApiWrappedOkResponse('Updated settings')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.id, dto);
  }
}
