import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT bearer token for authenticated requests',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmY2OTljNi04NTA3LTRiZDktYmQ4MS00ZTU3ZDM1ZWYzOWMiLCJlbWFpbCI6ImRlbW9AZ3JpZGxpZmUuYXBwIiwiaWF0IjoxNzgxNzcxODM3LCJleHAiOjE3ODIzNzY2Mzd9.example',
  })
  token: string;
}
