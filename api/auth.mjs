/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {handleAuthorize} from './_oauth.mjs';

export function GET(request) {
  return handleAuthorize(request);
}
