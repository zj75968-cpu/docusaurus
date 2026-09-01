import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import configTabs from './src/remark/configTabs';
import PrismLight from './src/utils/prismLight';
import PrismDark from './src/utils/prismDark';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const siteUrl = 'https://kb.n8nmydomain.com';
const defaultLocale = 'zh-CN';
const currentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE ?? defaultLocale;
const isChinese = currentLocale === defaultLocale;
const showLastUpdate = !process.env.VERCEL_ENV;

const copy = isChinese
  ? {
      title: 'ZJ 技术知识库',
      tagline: '连接 AI 自动化、软件工程、n8n、知识管理与开源实践',
      description:
        '面向实践的技术知识库，持续整理 AI 自动化、软件工程、n8n、知识管理与开源经验。',
      docs: '知识库',
      about: '关于',
      privacy: '隐私',
      github: 'GitHub',
      discussions: '交流讨论',
      language: '语言',
      footerExplore: '探索',
      footerConnect: '联系',
    }
  : {
      title: 'ZJ Technical Knowledge Base',
      tagline:
        'Connecting AI automation, software engineering, n8n, knowledge management, and open source',
      description:
        'A practical knowledge base for AI automation, software engineering, n8n, knowledge management, and open-source work.',
      docs: 'Knowledge Base',
      about: 'About',
      privacy: 'Privacy',
      github: 'GitHub',
      discussions: 'Discussions',
      language: 'Language',
      footerExplore: 'Explore',
      footerConnect: 'Connect',
    };

const config: Config = {
  title: copy.title,
  tagline: copy.tagline,
  url: siteUrl,
  baseUrl: '/',
  organizationName: 'zj75968-cpu',
  projectName: 'docusaurus',
  favicon: 'img/brand/favicon.svg',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
    remarkRehypeOptions: {
      footnoteLabel: isChinese ? '脚注' : 'Footnotes',
    },
  },
  stylesheets: [
    {
      href: '/katex/katex.min.css',
      type: 'text/css',
    },
  ],
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/manifest.json',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/img/brand/logo.svg',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#0f766e',
      },
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: copy.title,
        url: siteUrl,
        description: copy.description,
        inLanguage: isChinese ? 'zh-CN' : 'en',
        publisher: {
          '@type': 'Person',
          name: 'ZJ',
          url: 'https://github.com/zj75968-cpu',
        },
      }),
    },
  ],
  i18n: {
    defaultLocale,
    locales: [defaultLocale, 'en'],
    localeConfigs: {
      'zh-CN': {
        label: '简体中文',
        htmlLang: 'zh-CN',
        direction: 'ltr',
      },
      en: {
        label: 'English',
        htmlLang: 'en',
        direction: 'ltr',
      },
    },
  },
  plugins: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          include: ['knowledge-base/**/*.{md,mdx}'],
          sidebarPath: './sidebars.ts',
          showLastUpdateAuthor: showLastUpdate,
          showLastUpdateTime: showLastUpdate,
          disableVersioning: true,
          breadcrumbs: true,
          knowledgeGraph: {enabled: true},
          wikiLinks: true,
          remarkPlugins: [remarkMath, configTabs],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        pages: {},
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          filename: isChinese ? 'sitemap-zh-CN.xml' : 'sitemap-en.xml',
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: showLastUpdate ? 'date' : null,
          ignorePatterns: ['/admin/**', '/api/**'],
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/brand/social-card.png',
    metadata: [
      {name: 'description', content: copy.description},
      {property: 'og:description', content: copy.description},
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: copy.title},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      hideOnScroll: true,
      title: copy.title,
      logo: {
        alt: copy.title,
        src: 'img/brand/logo.svg',
        width: 34,
        height: 34,
      },
      items: [
        {
          type: 'doc',
          docId: 'knowledge-base/general/knowledge-base',
          label: copy.docs,
          position: 'left',
        },
        {to: '/about', label: copy.about, position: 'left'},
        {
          href: 'https://github.com/zj75968-cpu',
          label: copy.github,
          position: 'right',
        },
        {
          href: 'https://github.com/zj75968-cpu/docusaurus/discussions',
          label: copy.discussions,
          position: 'right',
        },
        {
          type: 'localeDropdown',
          label: copy.language,
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: copy.footerExplore,
          items: [
            {
              label: copy.docs,
              to: '/docs/knowledge-base/general/knowledge-base',
            },
            {label: copy.about, to: '/about'},
            {label: copy.privacy, to: '/privacy'},
          ],
        },
        {
          title: copy.footerConnect,
          items: [
            {label: copy.github, href: 'https://github.com/zj75968-cpu'},
            {
              label: copy.discussions,
              href: 'https://github.com/zj75968-cpu/docusaurus/discussions',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ZJ. Built with open-source software.`,
    },
    prism: {
      additionalLanguages: [
        'bash',
        'diff',
        'json',
        'powershell',
        'python',
        'typescript',
      ],
      theme: PrismLight,
      darkTheme: PrismDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
