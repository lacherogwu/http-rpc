import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '@http-rpc',
  description: 'Unify Frontend-Backend Interactions',
  head: [
    ['link', { href: '/logo.png', rel: 'icon', type: 'image/png' }],

  ],
  cleanUrls: true,
  themeConfig: {
    logo: '/logo.png',
    search: {
      provider: 'local'
    },
    editLink: {
      pattern: 'https://github.com/lacherogwu/http-rpc/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    nav: [
      { text: 'Guide', link: '/introduction' }
    ],
    outline: 'deep',

    sidebar: [
      {
        text: 'Getting started',
        items: [
          {
            link: '/introduction',
            text: 'Introduction'
          },
          {
            link: '/concepts',
            text: 'Concepts'
          },
          {
            link: '/demo',
            text: 'Demo'
          }
        ],
      },
      {
        text: 'Backend Usage',
        items: [
          {
            link: '/backend-usage/routes',
            text: 'Define Routes'
          },
          {
            link: '/backend-usage/endpoints',
            text: 'Define Endpoints'
          },
          {
            link: '/backend-usage/middlewares',
            text: 'Middlewares'
          },
          {
            link: '/backend-usage/input-output-validation',
            text: 'Input/Output Validation'
          },
          {
            link: '/backend-usage/errors',
            text: 'Errors'
          },
          {
            link: '/backend-usage/best-practice',
            text: 'Best Practice'
          },
        ],
      },
      {
        text: 'Client Usage',
        items: [
          {
            link: '/client-usage/create-client',
            text: 'Create Client'
          },
          {
            link: '/client-usage/best-practice',
            text: 'Best Practice'
          },
        ],
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lacherogwu/http-rpc' }
    ],

    footer: {
      copyright: 'Copyright © 2024-present',
      message: 'Released under the MIT License.'
    },
  }
})
