import { defineConfig } from 'rspress/config';
import { pluginTwoslash } from '@rspress/plugin-twoslash';
import { pluginLastUpdated } from '@rspress/plugin-last-updated';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  base: '/internationalized/',
  title: 'Internationalized 数字格式化',
  description: '强大、可逆的数字格式化与解析工具库',
  lang: 'zh-CN',
  plugins: [
    pluginTwoslash(),
    pluginLastUpdated(),
    pluginTypeDoc({
      typedocOptions: {
        entryPoints: ['src/index.ts'],
        tsconfig: 'tsconfig.json'
      }
    })
  ],
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '解析参考', link: '/reference/parser' },
      { text: 'API 参考', link: '/api/' },
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
