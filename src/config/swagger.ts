import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi.registry';

// Import schema registrations
import './openapi.schemas';

// Import path registrations (side effects trigger registry.registerPath calls)
import './openapi.paths.auth';
import './openapi.paths.cards';
import './openapi.paths.links';
import './openapi.paths.payments';
import './openapi.paths.users';
import './openapi.paths.analytics';
import './openapi.paths.admin';

registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Access token вида `Bearer <token>`',
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
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
        { url: 'https://linkoo.dev/api', description: 'Production' },
        { url: 'http://localhost:3000/api', description: 'Development' },
    ],
    tags: [
        { name: 'Auth', description: 'OAuth-аутентификация и управление сессиями' },
        { name: 'Users', description: 'Профиль пользователя, аватар и статистика' },
        { name: 'Cards', description: 'Цифровые визитки — создание, редактирование, поддомены' },
        { name: 'Links', description: 'Сокращённые ссылки и редиректы' },
        { name: 'Analytics', description: 'Аналитика просмотров и взаимодействий' },
        { name: 'Payments', description: 'Управление подпиской и платёжными методами' },
        { name: 'Admin', description: 'Административное управление платформой' },
    ],
});