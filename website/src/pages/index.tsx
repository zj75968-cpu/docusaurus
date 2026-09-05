import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const githubUrl = 'https://github.com/zj75968-cpu';
const discussionsUrl = 'https://github.com/zj75968-cpu/docusaurus/discussions';
const docsUrl = '/docs/knowledge-base/general/knowledge-base';
const liteLlmIntroUrl = '/docs/knowledge-base/guides/litellm-project-guide';
const liteLlmArchitectureUrl =
  '/docs/knowledge-base/guides/litellm-architecture-deep-dive';
const liteLlmLabUrl = '/docs/knowledge-base/guides/litellm-hands-on-lab';
const obsidianUrl = '/docs/knowledge-base/guides/obsidian-publishing-guide';
const brandMark = 'ZJ';
const brandCaption = 'KNOWLEDGE / PRACTICE';
const sectionArrow = '→';
const startLabel = 'START HERE';

const content = {
  'zh-CN': {
    description:
      '面向实践的技术知识库，持续整理 AI 自动化、软件工程、n8n、知识管理与开源经验。',
    eyebrow: 'ZJ 技术知识库 · 持续构建中',
    title: '把技术经验，沉淀为可连接的知识',
    intro:
      '记录真实问题的解决过程，提炼可以复用的方法，并用双向链接把零散经验组织成一张持续生长的知识网络。',
    browse: '浏览知识库',
    learnMore: '了解本站',
    proof: [
      ['5', '个长期主题'],
      ['中英', '双语发布'],
      ['开放', '协作与讨论'],
    ],
    featuredLabel: '推荐学习内容',
    featuredTitle: '从真实文章开始学习',
    featuredIntro:
      '两条可以马上开始的实践路径：理解并运行统一模型网关，或建立从 Obsidian 到知识库的发布流程。',
    liteLlmLabel: 'AI GATEWAY · 3 阶段',
    liteLlmTitle: 'LiteLLM：从概念到故障验证',
    liteLlmText:
      '先判断什么时候需要模型网关，再沿请求链读懂架构，最后亲手启动 Proxy 并观察错误发生在哪一层。',
    liteLlmStages: [
      ['01', '入门导读', '10 分钟建立核心概念', liteLlmIntroUrl],
      ['02', '架构深读', '沿一次请求阅读主调用链', liteLlmArchitectureUrl],
      ['03', '动手实验', '启动 Proxy 并验证三类故障', liteLlmLabUrl],
    ],
    obsidianLabel: 'KNOWLEDGE WORKFLOW',
    obsidianTitle: '使用 Obsidian 发布知识文章',
    obsidianText:
      '从标准 Markdown、WikiLink 和图片路径开始，走完中英文同步、内容校验与安全发布检查。',
    obsidianPoints: ['准备标准 Markdown', '连接文章与图片', '完成发布前校验'],
    obsidianAction: '阅读 Obsidian 发布指南',
    topicsTitle: '长期关注的主题',
    topicsIntro: '不追逐信息流，专注能够进入工作流、经得起复用的实践。',
    topics: [
      ['AI', 'AI 自动化', '把模型、工具与业务流程连接成可靠的自动化系统。'],
      ['SE', '软件工程', '记录架构、开发、测试、部署与工程质量的真实决策。'],
      ['n8n', 'n8n', '沉淀工作流设计、节点集成、运维与故障排查方法。'],
      ['KM', '知识管理', '探索 Markdown、Obsidian、知识图谱与长期写作流程。'],
      ['OSS', '开源', '分享开放协作、项目维护与可复用工具的实践。'],
    ],
    methodLabel: '知识如何形成',
    methodTitle: '从一次解决，走向长期复用',
    methods: [
      [
        '01',
        '源于实践',
        '文章从真实任务、故障或工程决策出发，而不是复制概念。',
      ],
      [
        '02',
        '经过验证',
        '尽量保留可执行步骤、约束和验证结果，让结论可以复现。',
      ],
      [
        '03',
        '彼此连接',
        '通过分类、标签和 WikiLink 建立上下文，减少孤立笔记。',
      ],
    ],
    startTitle: '从这里开始',
    startText:
      '先了解知识库的内容边界，或查看如何用 Obsidian 发布标准 Markdown。',
    startLinks: [
      ['知识库说明', docsUrl],
      [
        'Obsidian 发布指南',
        '/docs/knowledge-base/guides/obsidian-publishing-guide',
      ],
    ],
    collaborateTitle: '发现问题，或想继续讨论？',
    collaborateText:
      '内容与代码在 GitHub 上公开维护。请通过 Discussions 提问、补充案例或提出选题。',
    discussions: '进入 Discussions',
    github: '查看 GitHub',
  },
  en: {
    description:
      'A practical knowledge base for AI automation, software engineering, n8n, knowledge management, and open-source work.',
    eyebrow: 'ZJ Technical Knowledge Base · Continuously evolving',
    title: 'Turn technical experience into connected knowledge',
    intro:
      'Document how real problems are solved, distill reusable methods, and connect individual notes into a knowledge network that grows over time.',
    browse: 'Browse the knowledge base',
    learnMore: 'About this site',
    proof: [
      ['5', 'long-term topics'],
      ['ZH/EN', 'bilingual publishing'],
      ['Open', 'collaboration'],
    ],
    featuredLabel: 'Recommended learning',
    featuredTitle: 'Start with practical articles',
    featuredIntro:
      'Two paths you can use immediately: understand and run a unified model gateway, or build a publishing workflow from Obsidian to the knowledge base.',
    liteLlmLabel: 'AI GATEWAY · 3 STAGES',
    liteLlmTitle: 'LiteLLM: from concepts to failure checks',
    liteLlmText:
      'Decide when a model gateway is useful, follow one request through the architecture, then start a Proxy and identify the layer behind each failure.',
    liteLlmStages: [
      [
        '01',
        'Beginner guide',
        'Build the core mental model in 10 minutes',
        liteLlmIntroUrl,
      ],
      [
        '02',
        'Architecture deep dive',
        'Read the main path through one request',
        liteLlmArchitectureUrl,
      ],
      [
        '03',
        'Hands-on lab',
        'Start the Proxy and verify three failures',
        liteLlmLabUrl,
      ],
    ],
    obsidianLabel: 'KNOWLEDGE WORKFLOW',
    obsidianTitle: 'Publish knowledge articles with Obsidian',
    obsidianText:
      'Start with standard Markdown, WikiLinks, and image paths, then complete bilingual synchronization, content validation, and safety checks.',
    obsidianPoints: [
      'Prepare standard Markdown',
      'Connect articles and images',
      'Complete pre-publish validation',
    ],
    obsidianAction: 'Read the Obsidian publishing guide',
    topicsTitle: 'Long-term topics',
    topicsIntro:
      'Less attention to the feed, more focus on practices that enter real workflows and remain reusable.',
    topics: [
      [
        'AI',
        'AI automation',
        'Connect models, tools, and business processes into reliable automation systems.',
      ],
      [
        'SE',
        'Software engineering',
        'Capture real decisions across architecture, development, testing, and delivery.',
      ],
      [
        'n8n',
        'n8n',
        'Build a practical reference for workflow design, integrations, operations, and debugging.',
      ],
      [
        'KM',
        'Knowledge management',
        'Explore Markdown, Obsidian, knowledge graphs, and sustainable writing workflows.',
      ],
      [
        'OSS',
        'Open source',
        'Share practices for open collaboration, project maintenance, and reusable tools.',
      ],
    ],
    methodLabel: 'How knowledge develops',
    methodTitle: 'From one solution to lasting reuse',
    methods: [
      [
        '01',
        'Grounded in practice',
        'Articles begin with real tasks, failures, and engineering decisions—not copied concepts.',
      ],
      [
        '02',
        'Verified',
        'Executable steps, constraints, and evidence make each conclusion reproducible.',
      ],
      [
        '03',
        'Connected',
        'Categories, tags, and WikiLinks preserve context and prevent isolated notes.',
      ],
    ],
    startTitle: 'Start here',
    startText:
      'Learn the scope of this knowledge base, then see how standard Markdown is published from Obsidian.',
    startLinks: [
      ['Knowledge base overview', docsUrl],
      [
        'Obsidian publishing guide',
        '/docs/knowledge-base/guides/obsidian-publishing-guide',
      ],
    ],
    collaborateTitle: 'Found an issue or want to go deeper?',
    collaborateText:
      'The content and code are maintained openly on GitHub. Use Discussions to ask questions, add examples, or suggest topics.',
    discussions: 'Open Discussions',
    github: 'View GitHub',
  },
} as const;

export default function Home(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const copy = i18n.currentLocale === 'en' ? content.en : content['zh-CN'];

  return (
    <Layout description={copy.description}>
      <main>
        <header className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <Heading as="h1" className={styles.heroTitle}>
                {copy.title}
              </Heading>
              <p className={styles.heroIntro}>{copy.intro}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} to={docsUrl}>
                  {copy.browse}
                </Link>
                <Link className={styles.secondaryButton} to="/about">
                  {copy.learnMore}
                </Link>
              </div>
            </div>
            <div className={styles.heroMark} aria-hidden="true">
              <span>{brandMark}</span>
              <small>{brandCaption}</small>
            </div>
          </div>
          <div className={`container ${styles.proofGrid}`}>
            {copy.proof.map(([value, label]) => (
              <div className={styles.proofItem} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </header>

        <section className={styles.featuredSection}>
          <div className="container">
            <div className={styles.featuredHeading}>
              <p className={styles.sectionLabel}>{copy.featuredLabel}</p>
              <div>
                <Heading as="h2">{copy.featuredTitle}</Heading>
                <p className={styles.featuredIntro}>{copy.featuredIntro}</p>
              </div>
            </div>

            <div className={styles.featuredGrid}>
              <article className={styles.liteLlmCard}>
                <div className={styles.featuredCardHeader}>
                  <span className={styles.cardLabelInverse}>
                    {copy.liteLlmLabel}
                  </span>
                  <Heading as="h3" className={styles.cardTitleInverse}>
                    {copy.liteLlmTitle}
                  </Heading>
                  <p className={styles.cardTextInverse}>{copy.liteLlmText}</p>
                </div>
                <div className={styles.learningPath}>
                  {copy.liteLlmStages.map(
                    ([number, title, description, to]) => (
                      <Link className={styles.learningStep} to={to} key={to}>
                        <span className={styles.learningNumber}>{number}</span>
                        <span className={styles.learningCopy}>
                          <strong>{title}</strong>
                          <small>{description}</small>
                        </span>
                        <span
                          className={styles.learningArrow}
                          aria-hidden="true">
                          {sectionArrow}
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </article>

              <article className={styles.obsidianCard}>
                <div className={styles.featuredCardHeader}>
                  <span className={styles.cardLabel}>{copy.obsidianLabel}</span>
                  <Heading as="h3" className={styles.cardTitle}>
                    {copy.obsidianTitle}
                  </Heading>
                  <p className={styles.cardText}>{copy.obsidianText}</p>
                </div>
                <ul className={styles.obsidianPoints}>
                  {copy.obsidianPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <Link className={styles.featuredAction} to={obsidianUrl}>
                  <span>{copy.obsidianAction}</span>
                  <span
                    className={styles.featuredActionArrow}
                    aria-hidden="true">
                    {sectionArrow}
                  </span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <Heading as="h2">{copy.topicsTitle}</Heading>
              <p>{copy.topicsIntro}</p>
            </div>
            <div className={styles.topicGrid}>
              {copy.topics.map(([code, title, description]) => (
                <article className={styles.topicCard} key={title}>
                  <span className={styles.topicCode}>{code}</span>
                  <Heading as="h3">{title}</Heading>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.methodSection}>
          <div className={`container ${styles.methodLayout}`}>
            <div className={styles.methodHeading}>
              <p className={styles.sectionLabel}>{copy.methodLabel}</p>
              <Heading as="h2">{copy.methodTitle}</Heading>
            </div>
            <div className={styles.methodList}>
              {copy.methods.map(([number, title, description]) => (
                <article className={styles.methodItem} key={number}>
                  <span>{number}</span>
                  <div>
                    <Heading as="h3">{title}</Heading>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`container ${styles.startGrid}`}>
            <div>
              <p className={styles.sectionLabel}>{startLabel}</p>
              <Heading as="h2">{copy.startTitle}</Heading>
              <p className={styles.startText}>{copy.startText}</p>
            </div>
            <div className={styles.startLinks}>
              {copy.startLinks.map(([label, to]) => (
                <Link className={styles.articleLink} to={to} key={to}>
                  <span>{label}</span>
                  <span aria-hidden="true">{sectionArrow}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.collaborateSection}>
          <div className={`container ${styles.collaborateInner}`}>
            <div>
              <Heading as="h2">{copy.collaborateTitle}</Heading>
              <p>{copy.collaborateText}</p>
            </div>
            <div className={styles.collaborateActions}>
              <Link className={styles.lightButton} href={discussionsUrl}>
                {copy.discussions}
              </Link>
              <Link className={styles.ghostButton} href={githubUrl}>
                {copy.github}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
