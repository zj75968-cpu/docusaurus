/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode} from 'react';
import classNames from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function LinkCard({
  href,
  title,
  description,
  className,
}: {
  href: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <Link className={classNames(styles.card, className)} to={href}>
      <span className={styles.title}>{title}</span>
      {description && <span className={styles.description}>{description}</span>}
    </Link>
  );
}