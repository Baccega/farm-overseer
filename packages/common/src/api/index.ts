import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';
export const Health = Schema.Struct({ status: Schema.Literal('ok') });
export class AppApi extends HttpApi.make('FarmOverseer').add(
  HttpApiGroup.make('health').add(HttpApiEndpoint.get('get', '/health').addSuccess(Health)),
) {}
