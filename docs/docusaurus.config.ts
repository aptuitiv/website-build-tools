import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'Aptuitiv Website Build Tools',
    tagline: 'Build tools to help with building and deploying websites at Aptuitiv.',
    favicon: 'img/favicon.png',

    // Set the production url of your site here
    url: 'https://aptuitiv.github.io/',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/website-build-tools/',
    trailingSlash: false, // Set to true if you want to use /<page-name>/ instead of /<page-name>.html

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'aptuitiv', // Usually your GitHub org/user name.
    projectName: 'aptuitiv.github.io', // Usually your repo name.

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                // Docs configuration: https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs
                docs: {
                    routeBasePath: '/',
                    sidebarPath: './sidebars.ts',
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        // image: 'img/docusaurus-social-card.jpg',
        docs: {
            // https://docusaurus.io/docs/sidebar#theme-configuration
            sidebar: {
                autoCollapseCategories: true,
                hideable: true,
            },
        },
        navbar: {
            title: 'Aptuitiv Website Build Tools',
            logo: {
                alt: 'Aptuitiv',
                src: '/img/logo.png',
            },
            items: [
                // {
                //     type: 'docSidebar',
                //     sidebarId: 'tutorialSidebar',
                //     position: 'left',
                //     label: 'Tutorial',
                // },
                {
                    href: 'https://www.aptuitiv.com',
                    label: 'Aptuitiv',
                    position: 'right',
                },
                {
                    href: 'https://github.com/aptuitiv/website-build-tools',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            copyright: `Copyright © ${new Date().getFullYear()} <a href="https://www.aptuitiv.com">Aptuitiv, Inc.</a>`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
