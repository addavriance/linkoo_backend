import {ApiResponse} from '@/types';

export const formatResponse = <T>(response: ApiResponse<T>): ApiResponse<T> => {
    return {
        success: response.success,
        ...(response.data !== undefined && {data: response.data}),
        ...(response.error && {error: response.error}),
        ...(response.meta && {meta: response.meta}),
    };
};

export const successResponse = <T>(
    data: T,
    meta?: ApiResponse['meta']
): ApiResponse<T> => {
    return formatResponse({
        success: true,
        data,
        meta,
    });
};

export const errorResponse = (
    message: string,
    code: number = 500,
    details?: unknown
): ApiResponse => {
    return formatResponse({
        success: false,
        error: {message, code, details},
    });
};

export const paginatedResponse = <T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): ApiResponse<T[]> => {
    return formatResponse({
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
};
