import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const content = {
  'zh-CN': {
    title: '关于本站',
    description:
      'ZJ 技术知识库整理 AI 自动化、软件工程、n8n、知识管理与开源实践。',
    lead: '这里不是新闻聚合站，而是一套公开、可连接、可持续维护的技术工作笔记。',
    purposeTitle: '为什么建立这个知识库',
    purpose: [
      '技术经验很容易散落在聊天记录、临时文档和已经遗忘的项目中。本站把真实任务中的判断、失败和验证过程整理成标准 Markdown，让经验能够被搜索、复用和继续修订。',
      '内容主要围绕 AI 自动化、软件工程、n8n、知识管理和开源。文章会优先说明适用边界、执行步骤和验证方式，而不是只给出脱离上下文的结论。',
    ],
    principlesTitle: '内容原则',
    principles: [
      '实践优先：从实际问题出发，保留约束与取舍。',
      '验证优先：能运行就运行，能测量就提供证据。',
      '开放连接：使用链接、分类和标签建立上下文。',
      '持续修订：文章不是终稿，会随实践更新。',
    ],
    contactTitle: '联系与协作',
    contact:
      '内容和站点代码在 GitHub 公开维护。一般问题、补充案例与选题建议请优先发到 Discussions；代码问题可以在仓库中提交 Issue 或 Pull Request。',
    discussions: 'GitHub Discussions',
    github: '个人 GitHub',
    asideTitle: '站点信息',
    aside: [
      ['维护者', 'ZJ'],
      ['长期域名', 'kb.n8nmydomain.com'],
      ['默认语言', '简体中文'],
      ['英文路径', '/en/'],
    ],
  },
  en: {
    title: 'About',
    description:
      'The ZJ Technical Knowledge Base covers AI automation, software engineering, n8n, knowledge management, and open source.',
    lead: 'This is not a news feed. It is an open, connected, and maintainable set of technical working notes.',
    purposeTitle: 'Why this knowledge base exists',
    purpose: [
      'Technical experience is easily lost across chats, temporary documents, and old projects. This site turns decisions, failures, and verification from real work into standard Markdown that can be searched, reused, and revised.',
      'The main topics are AI automation, software engineering, n8n, knowledge management, and open source. Articles prioritize scope, executable steps, and evidence over conclusions without context.',
    ],
    principlesTitle: 'Editorial principles',
    principles: [
      'Practice first: begin with real problems and preserve constraints and trade-offs.',
      'Verification first: run what can be run and provide evidence where possible.',
      'Open connections: use links, categories, and tags to retain context.',
      'Continuous revision: articles evolve with new practice.',
    ],
    contactTitle: 'Contact and collaboration',
    contact:
      'The content and site code are maintained openly on GitHub. Use Discussions for questions, examples, and topic suggestions. Use Issues or Pull Requests for code changes.',
    discussions: 'GitHub Discussions',
    github: 'Personal GitHub',
    asideTitle: 'Site details',
    aside: [
      ['Maintainer', 'ZJ'],
      ['Canonical domain', 'kb.n8nmydomain.com'],
      ['Default language', 'Simplified Chinese'],
      ['English path', '/en/'],
    ],
  },
} as const;

export default function About(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const copy = i18n.currentLocale === 'en' ? content.en : content['zh-CN'];

  return (
    <Layout title={copy.title} description={copy.description}>
      <main className={styles.pageMain}>
        <div className="container">
          <header className={styles.pageHeader}>
            <p className={styles.sectionLabel}>ABOUT / ZJ KB</p>
            <Heading as="h1">{copy.title}</Heading>
            <p className={styles.pageLead}>{copy.lead}</p>
          </header>
          <div className={styles.pageGrid}>
            <aside className={styles.pageAside}>
              <Heading as="h2">{copy.asideTitle}</Heading>
              {copy.aside.map(([label, value]) => (
                <p key={label}>
                  <strong>{label}</strong>
                  <br />
                  {value}
                </p>
              ))}
            </aside>
            <div className={styles.pageContent}>
              <section>
                <Heading as="h2">{copy.purposeTitle}</Heading>
                {copy.purpose.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
              <section>
                <Heading as="h2">{copy.principlesTitle}</Heading>
                <ul>
                  {copy.principles.map((principle) => (
                    <li key={principle}>{principle}</li>
                  ))}
                </ul>
              </section>
              <section>
                <Heading as="h2">{copy.contactTitle}</Heading>
                <p>{copy.contact}</p>
                <p>
                  <Link href="https://github.com/zj75968-cpu/docusaurus/discussions">
                    {copy.discussions}
                  </Link>
                  {' · '}
                  <Link href="https://github.com/zj75968-cpu">
                    {copy.github}
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
