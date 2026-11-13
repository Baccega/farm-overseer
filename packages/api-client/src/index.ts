import { HttpApiClient } from '@effect/platform';
import { AppApi } from '@app/common';
export const makeApiClient = (baseUrl: string) => HttpApiClient.make(AppApi, { baseUrl });
