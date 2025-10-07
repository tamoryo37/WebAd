import { logger } from './logger';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

export const handleError = (error: any): AppError => {
  logger.error('Application error', error);

  if (error?.code === 'PGRST116') {
    return {
      message: 'データが見つかりませんでした',
      code: 'NOT_FOUND',
      status: 404,
    };
  }

  if (error?.code === '23505') {
    return {
      message: 'このデータは既に存在します',
      code: 'DUPLICATE',
      status: 409,
    };
  }

  if (error?.code === '23503') {
    return {
      message: '関連するデータが存在しないため、操作を完了できません',
      code: 'FOREIGN_KEY_VIOLATION',
      status: 400,
    };
  }

  if (error?.message?.includes('JWT')) {
    return {
      message: 'セッションが無効です。再度ログインしてください',
      code: 'AUTH_ERROR',
      status: 401,
    };
  }

  if (error?.message?.includes('permission')) {
    return {
      message: 'この操作を実行する権限がありません',
      code: 'PERMISSION_DENIED',
      status: 403,
    };
  }

  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('network')) {
    return {
      message: 'ネットワークエラーが発生しました。接続を確認してください',
      code: 'NETWORK_ERROR',
      status: 503,
    };
  }

  return {
    message: error?.message || '予期しないエラーが発生しました',
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
};

export const showErrorToast = (error: any) => {
  const appError = handleError(error);
  alert(appError.message);
};
