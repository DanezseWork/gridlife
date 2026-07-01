import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  parseTimezoneOffsetHeader,
  runWithTimezoneOffset,
} from '../timezone/timezone.context';

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const offset = parseTimezoneOffsetHeader(req.headers['x-timezone-offset']);
    runWithTimezoneOffset(offset, () => next());
  }
}
