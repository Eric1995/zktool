export interface DubboServiceInstanceDto {
  ip: string;
  port: number;
  url: string;
  exceptionMessage: string | null;
  parameters: Record<string, string>;
  resourceStatus: {
    resource: string;
    message: string;
    status: 'OK' | 'WARN' | 'ERROR';
  }[];
}

export interface DubboServiceInstanceBundleDto {
  service: string;
  methods: string;
  version: string;
  instances: DubboServiceInstanceDto[];
}

export interface DubboInstanceTestResultDto {
  success: boolean;
  res: any;
  error: {
    name: string;
    message: string;
    stack: string;
  };
}
