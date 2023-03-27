import { LanguageEnum } from './enum/lang';

export interface Portal {
    appGlobal: {
      attributes: {
        language: LanguageEnum;
        userId: number;
        userName: string;
        userCode: string;
        projectName?: string;
        projectId?: number;
        _csrf: string;
        _csrf_header: string;
        _csrf_parameterName: string;
      };
    };
    [key: string]: any;
  }
