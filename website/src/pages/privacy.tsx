import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const content = {
  'zh-CN': {
    title: '隐私说明',
    description: 'ZJ 技术知识库的隐私与外部服务说明。',
    lead: '本站尽量减少数据处理。本说明如实列出公开访问和内容管理过程中涉及的服务。',
    updated: '更新日期：2026 年 3 月 14 日',
    analyticsTitle: '统计与广告',
    analytics:
      '本站首发阶段不使用访问统计、广告追踪、用户画像或第三方营销脚本。公开页面不要求注册或登录。',
    hostingTitle: '托管与服务日志',
    hosting:
      '本站托管在 Vercel，并通过自有域名提供访问。Vercel 及网络基础设施可能为安全、故障排查和服务运行处理必要的请求信息，例如 IP 地址、请求时间、User-Agent 与访问路径；这些处理受相应服务提供商的政策约束。',
    cmsTitle: '内容管理与 GitHub OAuth',
    cms: '管理入口使用 GitHub OAuth 验证有仓库权限的编辑者。OAuth 流程会使用短期安全 Cookie、state 与 PKCE 参数来完成登录保护；这些机制用于管理操作，不用于追踪普通访客。GitHub 会按照其隐私政策处理登录和授权信息。',
    externalTitle: '外部链接',
    external:
      '本站包含 GitHub 与 GitHub Discussions 等外部链接。离开本站后，相关服务会依据自己的隐私政策处理数据。',
    contactTitle: '联系',
    contact:
      '如果你对本说明或站点数据处理有疑问，请通过 GitHub Discussions 联系。',
    contactLink: '前往 Discussions',
  },
  en: {
    title: 'Privacy',
    description:
      'Privacy and external-service information for the ZJ Technical Knowledge Base.',
    lead: 'This site minimizes data processing. This notice describes the services involved in public access and content administration.',
    updated: 'Last updated: March 14, 2026',
    analyticsTitle: 'Analytics and advertising',
    analytics:
      'At launch, this site does not use visitor analytics, advertising trackers, user profiling, or third-party marketing scripts. Public pages do not require registration or login.',
    hostingTitle: 'Hosting and service logs',
    hosting:
      'This site is hosted on Vercel and served through its own domain. Vercel and network infrastructure may process request information needed for security, troubleshooting, and service operation, such as IP address, request time, User-Agent, and path. Their respective policies govern that processing.',
    cmsTitle: 'Content management and GitHub OAuth',
    cms: 'The administration area uses GitHub OAuth to verify editors with repository access. The OAuth flow uses short-lived security cookies, state, and PKCE parameters to protect sign-in. These mechanisms support administration and are not used to track ordinary visitors. GitHub processes sign-in and authorization information under its privacy policy.',
    externalTitle: 'External links',
    external:
      'This site links to external services including GitHub and GitHub Discussions. Their own privacy policies apply after you leave this site.',
    contactTitle: 'Contact',
    contact:
      'For questions about this notice or site data handling, contact the maintainer through GitHub Discussions.',
    contactLink: 'Open Discussions',
  },
} as const;

export default function Privacy(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const copy = i18n.currentLocale === 'en' ? content.en : content['zh-CN'];

  return (
    <Layout title={copy.title} description={copy.description}>
      <main className={styles.pageMain}>
        <div className="container">
          <header className={styles.pageHeader}>
            <p className={styles.sectionLabel}>PRIVACY / MINIMAL DATA</p>
            <Heading as="h1">{copy.title}</Heading>
            <p className={styles.pageLead}>{copy.lead}</p>
            <p>{copy.updated}</p>
          </header>
          <div className={styles.pageContent}>
            {[
              [copy.analyticsTitle, copy.analytics],
              [copy.hostingTitle, copy.hosting],
              [copy.cmsTitle, copy.cms],
              [copy.externalTitle, copy.external],
              [copy.contactTitle, copy.contact],
            ].map(([title, text]) => (
              <section key={title}>
                <Heading as="h2">{title}</Heading>
                <p>{text}</p>
              </section>
            ))}
            <p>
              <Link href="https://github.com/zj75968-cpu/docusaurus/discussions">
                {copy.contactLink}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
