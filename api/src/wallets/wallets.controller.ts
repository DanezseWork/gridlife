import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.walletsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletsService.update(user.id, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.walletsService.delete(user.id, id);
  }
}
