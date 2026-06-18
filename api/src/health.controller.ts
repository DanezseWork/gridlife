import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiWrappedOkResponse } from './common/swagger/api-response.helpers';
import { Public } from './auth/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiWrappedOkResponse('Service is healthy', {
    type: 'object',
    properties: { status: { type: 'string', example: 'ok' } },
  })
  health() {
    return { status: 'ok' };
  }
}
