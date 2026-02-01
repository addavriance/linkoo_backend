import {RefreshToken} from '../models/RefreshToken';

/**
 * Удаляет истекшие и отозванные refresh токены из базы данных
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
    try {
        const now = new Date();

        // Удаляем токены, которые истекли более 7 дней назад
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const result = await RefreshToken.deleteMany({
            $or: [
                // Истекшие токены
                {expiresAt: {$lt: sevenDaysAgo}},
                // Отозванные токены старше 7 дней
                {
                    isRevoked: true,
                    createdAt: {$lt: sevenDaysAgo}
                }
            ]
        });

        if (result.deletedCount > 0) {
            console.log(`[Cleanup] Removed ${result.deletedCount} expired/revoked tokens`);
        }
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup expired tokens:', error);
    }
};

/**
 * Запускает периодическую очистку токенов
 * @param intervalHours Интервал в часах (по умолчанию 24 часа)
 */
export const startTokenCleanup = (intervalHours: number = 24): NodeJS.Timeout => {
    // Запускаем сразу
    cleanupExpiredTokens();

    // Затем периодически
    const intervalMs = intervalHours * 60 * 60 * 1000;
    return setInterval(cleanupExpiredTokens, intervalMs);
};
