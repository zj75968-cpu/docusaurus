/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode} from 'react';
import classNames from 'clsx';
import styles from './styles.module.css';

export default function CardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return <div className={classNames(styles.grid, className)}>{children}</div>;
}