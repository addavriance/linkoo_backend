import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Linkoo API',
            version: '1.0.0',
            description:
                'REST API платформы цифровых визиток **Linkoo**. ' +
                'Позволяет управлять профилями, сокращёнными ссылками, аналитикой и подпиской.\n\n' +
                'Для защищённых эндпоинтов необходим `accessToken`, получаемый после OAuth-аутентификации.',
        },
        servers: [
            {url: 'https://linkoo.dev/api', description: 'Production'},
            {url: 'http://localhost:3000/api', description: 'Development'},
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Access token вида `Bearer <token>`',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        message: {type: 'string', example: 'Ошибка авторизации'},
                    },
                },
                MessageResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        message: {type: 'string', example: 'Операция выполнена успешно'},
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: {type: 'string', description: 'JWT access token (15 мин)'},
                        refreshToken: {type: 'string', description: 'Refresh token (30 дней)'},
                        user: {$ref: '#/components/schemas/User'},
                    },
                },
                Social: {
                    type: 'object',
                    required: ['platform', 'link'],
                    properties: {
                        platform: {
                            type: 'string',
                            enum: [
                                'telegram', 'whatsapp', 'instagram', 'youtube',
                                'linkedin', 'twitter', 'facebook', 'github',
                                'tiktok', 'discord', 'vk', 'custom',
                            ],
                        },
                        link: {type: 'string', example: 'https://t.me/username'},
                    },
                },
                CustomTheme: {
                    type: 'object',
                    required: ['background', 'textColor', 'accentColor'],
                    properties: {
                        background: {type: 'string', example: '#ffffff'},
                        textColor: {type: 'string', example: '#000000'},
                        accentColor: {type: 'string', example: '#6366f1'},
                        backdrop: {type: 'string'},
                        border: {type: 'string'},
                    },
                },
                CardVisibility: {
                    type: 'object',
                    properties: {
                        showEmail: {type: 'boolean', default: true},
                        showPhone: {type: 'boolean', default: true},
                        showLocation: {type: 'boolean', default: true},
                    },
                },
                Card: {
                    type: 'object',
                    properties: {
                        _id: {type: 'string', example: '507f1f77bcf86cd799439011'},
                        userId: {type: 'string'},
                        name: {type: 'string', example: 'Иван Иванов', maxLength: 100},
                        title: {type: 'string', example: 'Frontend Developer', maxLength: 100},
                        description: {type: 'string', maxLength: 500},
                        email: {type: 'string', format: 'email'},
                        phone: {type: 'string', example: '+7 999 123 45 67', maxLength: 20},
                        website: {type: 'string', format: 'uri'},
                        company: {type: 'string', maxLength: 100},
                        location: {type: 'string', maxLength: 100},
                        avatar: {type: 'string', format: 'uri'},
                        socials: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/Social'},
                            maxItems: 12,
                        },
                        theme: {type: 'string', example: 'light_minimal'},
                        customTheme: {$ref: '#/components/schemas/CustomTheme'},
                        visibility: {$ref: '#/components/schemas/CardVisibility'},
                        subdomain: {type: 'string', example: 'ivan'},
                        slug: {type: 'string', example: 'abc123'},
                        isActive: {type: 'boolean'},
                        isPublic: {type: 'boolean'},
                        viewCount: {type: 'integer'},
                        lastViewedAt: {type: 'string', format: 'date-time'},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                    },
                },
                CardInput: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: {type: 'string', example: 'Иван Иванов', maxLength: 100},
                        title: {type: 'string', example: 'Frontend Developer', maxLength: 100},
                        description: {type: 'string', maxLength: 500},
                        email: {type: 'string', format: 'email'},
                        phone: {type: 'string', maxLength: 20},
                        website: {type: 'string', format: 'uri'},
                        company: {type: 'string', maxLength: 100},
                        location: {type: 'string', maxLength: 100},
                        socials: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/Social'},
                            maxItems: 12,
                        },
                        theme: {type: 'string'},
                        customTheme: {$ref: '#/components/schemas/CustomTheme'},
                        visibility: {$ref: '#/components/schemas/CardVisibility'},
                        isPublic: {type: 'boolean'},
                    },
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                        avatar: {type: 'string'},
                        locale: {type: 'string', example: 'ru'},
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: {type: 'string'},
                        email: {type: 'string', format: 'email'},
                        phone: {type: 'string'},
                        provider: {
                            type: 'string',
                            enum: ['google', 'vk', 'discord', 'github', 'max'],
                        },
                        accountType: {
                            type: 'string',
                            enum: ['free', 'paid'],
                        },
                        profile: {$ref: '#/components/schemas/UserProfile'},
                        settings: {
                            type: 'object',
                            properties: {
                                emailNotifications: {type: 'boolean'},
                                language: {type: 'string'},
                            },
                        },
                        subscription: {
                            type: 'object',
                            properties: {
                                plan: {type: 'string'},
                                expiresAt: {type: 'string', format: 'date-time'},
                                autoRenew: {type: 'boolean'},
                            },
                        },
                        lastLoginAt: {type: 'string', format: 'date-time'},
                        createdAt: {type: 'string', format: 'date-time'},
                    },
                },
                Session: {
                    type: 'object',
                    properties: {
                        id: {type: 'string'},
                        userAgent: {type: 'string'},
                        ip: {type: 'string'},
                        createdAt: {type: 'string', format: 'date-time'},
                        lastUsedAt: {type: 'string', format: 'date-time'},
                    },
                },
                ShortenedLink: {
                    type: 'object',
                    properties: {
                        _id: {type: 'string'},
                        userId: {type: 'string'},
                        targetType: {type: 'string', enum: ['url', 'card']},
                        rawData: {type: 'string', description: 'URL назначения (для targetType=url)'},
                        cardId: {type: 'string', description: 'ID карточки (для targetType=card)'},
                        slug: {type: 'string', example: 'abc123'},
                        subdomain: {type: 'string'},
                        isActive: {type: 'boolean'},
                        expiresAt: {type: 'string', format: 'date-time'},
                        createdAt: {type: 'string', format: 'date-time'},
                    },
                },
                LinkStats: {
                    type: 'object',
                    properties: {
                        slug: {type: 'string'},
                        totalClicks: {type: 'integer'},
                        uniqueClicks: {type: 'integer'},
                        clicksChart: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: {type: 'string'},
                                    clicks: {type: 'integer'},
                                },
                            },
                        },
                    },
                },
                UserStats: {
                    type: 'object',
                    properties: {
                        totalCards: {type: 'integer'},
                        totalLinks: {type: 'integer'},
                        totalViews: {type: 'integer'},
                        totalClicks: {type: 'integer'},
                    },
                },
                AnalyticsEvent: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                        type: {
                            type: 'string',
                            enum: [
                                'social_click', 'contact_save',
                                'share', 'website_click',
                                'email_click', 'phone_click',
                            ],
                        },
                        platform: {
                            type: 'string',
                            description: 'Платформа (для social_click)',
                            example: 'telegram',
                        },
                    },
                },
                ViewsChartItem: {
                    type: 'object',
                    properties: {
                        date: {type: 'string', example: '2025-01-15'},
                        views: {type: 'integer'},
                        unique: {type: 'integer'},
                    },
                },
                DeviceStat: {
                    type: 'object',
                    properties: {
                        type: {type: 'string', enum: ['mobile', 'tablet', 'desktop']},
                        count: {type: 'integer'},
                    },
                },
                CountryStat: {
                    type: 'object',
                    properties: {
                        code: {type: 'string', example: 'RU'},
                        count: {type: 'integer'},
                    },
                },
                RecentActivityItem: {
                    type: 'object',
                    properties: {
                        type: {type: 'string'},
                        platform: {type: 'string'},
                        timestamp: {type: 'string', format: 'date-time'},
                    },
                },
                AnalyticsData: {
                    type: 'object',
                    properties: {
                        cardId: {type: 'string'},
                        period: {type: 'string', enum: ['7d', '30d']},
                        totalViews: {type: 'integer'},
                        uniqueViews: {type: 'integer'},
                        viewsChart: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/ViewsChartItem'},
                        },
                        devices: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/DeviceStat'},
                        },
                        countries: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/CountryStat'},
                        },
                        interactionSummary: {
                            type: 'object',
                            properties: {
                                contactSaves: {type: 'integer'},
                                shares: {type: 'integer'},
                                websiteClicks: {type: 'integer'},
                                emailClicks: {type: 'integer'},
                                phoneClicks: {type: 'integer'},
                                socialClicks: {type: 'object', additionalProperties: {type: 'integer'}},
                            },
                        },
                        recentActivity: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/RecentActivityItem'},
                        },
                    },
                },
                PaymentCreate: {
                    type: 'object',
                    properties: {
                        paymentUrl: {type: 'string', format: 'uri'},
                        paymentKey: {type: 'string'},
                    },
                },
                PaymentStatus: {
                    type: 'object',
                    properties: {
                        status: {type: 'string', enum: ['pending', 'paid', 'failed', 'cancelled']},
                        paymentKey: {type: 'string'},
                        amount: {type: 'number'},
                        createdAt: {type: 'string', format: 'date-time'},
                    },
                },
                PaymentMethod: {
                    type: 'object',
                    properties: {
                        paymentMethodId: {type: 'string'},
                        type: {type: 'string', example: 'card'},
                        last4: {type: 'string', example: '4242'},
                        brand: {type: 'string', example: 'Visa'},
                    },
                },
            },
        },
        tags: [
            {name: 'Auth', description: 'OAuth-аутентификация и управление сессиями'},
            {name: 'Users', description: 'Профиль пользователя, аватар и статистика'},
            {name: 'Cards', description: 'Цифровые визитки — создание, редактирование, поддомены'},
            {name: 'Links', description: 'Сокращённые ссылки и редиректы'},
            {name: 'Analytics', description: 'Аналитика просмотров и взаимодействий'},
            {name: 'Payments', description: 'Управление подпиской и платёжными методами'},
        ],
    },
    apis: [
        path.join(__dirname, '../routes/*.ts'),
        path.join(__dirname, '../routes/*.js'),
    ],
};

export const swaggerSpec = swaggerJsdoc(options);