import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

const TIMESTAMP = {
  type: 'string',
  format: 'date-time',
  example: '2026-06-18T08:37:17.456Z',
} as const;

function wrappedSchema(data: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      data,
      timestamp: TIMESTAMP,
    },
    required: ['data', 'timestamp'],
  };
}

export function ApiWrappedOkResponse(
  description: string,
  dataSchema: Record<string, unknown> = { type: 'object' },
) {
  return ApiOkResponse({
    description: `${description}. Response body is wrapped as { data, timestamp }.`,
    schema: wrappedSchema(dataSchema),
  });
}

export function ApiWrappedCreatedResponse(
  description: string,
  dataSchema: Record<string, unknown> = { type: 'object' },
) {
  return ApiCreatedResponse({
    description: `${description}. Response body is wrapped as { data, timestamp }.`,
    schema: wrappedSchema(dataSchema),
  });
}

export function ApiWrappedCreatedResponseModel(
  model: Type<unknown>,
  description: string,
  isArray = false,
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiCreatedResponse({
      description: `${description}. Response body is wrapped as { data, timestamp }.`,
      schema: wrappedSchema(
        isArray
          ? { type: 'array', items: { $ref: getSchemaPath(model) } }
          : { $ref: getSchemaPath(model) },
      ),
    }),
  );
}

export function ApiWrappedOkResponseModel(
  model: Type<unknown>,
  description: string,
  isArray = false,
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: `${description}. Response body is wrapped as { data, timestamp }.`,
      schema: wrappedSchema(
        isArray
          ? { type: 'array', items: { $ref: getSchemaPath(model) } }
          : { $ref: getSchemaPath(model) },
      ),
    }),
  );
}
