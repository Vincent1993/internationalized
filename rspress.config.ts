import { defineConfig } from 'rspress/config';

export default defineConfig({
  title: 'Internationalized 数字格式化',
  description: '强大、可逆的数字格式化与解析工具库',
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '解析参考', link: '/reference/parser' },
      { text: 'GitHub', link: 'https://github.com/Vincent1993/internationalized' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '快速上手',
          link: '/guide/getting-started'
        },
        {
          text: '格式化能力',
          link: '/guide/formatting'
        },
        {
          text: '集成与自动化',
          link: '/guide/tooling'
        }
      ],
      '/reference/': [
        {
          text: '解析输出说明',
          link: '/reference/parser'
        }
      ]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Vincent1993/internationalized' }]
  },
  markdown: {
    lineNumbers: true
  }
});
