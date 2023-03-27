import { Res } from '@/types/dto';
import { DubboServiceInstanceBundleDto } from '@/types/dto/dubbo';
import { ZookeeperNodeDto } from '@/types/dto/zookeeper';
import splitApi from '.';

const withTags = splitApi.enhanceEndpoints({
  addTagTypes: [''],
});

const dubboApi = withTags.injectEndpoints({
  endpoints: (build) => ({
    getDubboEnabled: build.query<Res<boolean>, void>({
      query: () => ({
        url: '/dubboEnabled',
      }),
    }),
    getRegistryGroups: build.query<Res<string[]>, string>({
      query: (address) => ({
        url: '/zookeeper/children',
        method: 'POST',
        body: {
          zkAddress: address,
          path: '/',
        },
      }),
      transformResponse(baseQueryReturnValue: Res<ZookeeperNodeDto[]>, meta, arg) {
        return {
          ...baseQueryReturnValue,
          body: baseQueryReturnValue.body.map((data) => data.name),
        };
      },
      providesTags: [],
    }),
    getDubboServices: build.query<Res<string[]>, { address: string; registryGroup: string }>({
      query: ({ address, registryGroup }) => ({
        url: '/zookeeper/children',
        method: 'POST',
        body: {
          zkAddress: address,
          path: registryGroup.startsWith('/') ? registryGroup : `/${registryGroup}`,
        },
      }),
      transformResponse(baseQueryReturnValue: Res<ZookeeperNodeDto[]>, meta, arg) {
        return {
          ...baseQueryReturnValue,
          body: baseQueryReturnValue.body.map((data) => data.name),
        };
      },
      providesTags: [],
    }),
    queryDubboProviders: build.query<Res<string[]>, { zkAddress: string; registryGroup: string; service: string }>({
      query: (payload) => ({
        url: '/dubbo/instances',
        params: payload,
      }),
    }),
    getDubboInstances: build.query<Res<DubboServiceInstanceBundleDto>, { zkAddress: string; registryGroup: string; service: string }>({
      query: (payload) => ({
        url: '/check',
        params: payload,
      }),
      providesTags: [],
    }),
    checkService: build.mutation<
      Res<
        Record<
          string,
          {
            resource: string;
            message: string;
            status: 'OK' | 'WARN' | 'ERROR';
          }[]
        >
      >,
      Record<string, any>
    >({
      query: (body) => ({
        url: '/dubbo/check',
        method: 'POST',
        body,
      }),
    }),
    testInstance: build.mutation<
      Res<unknown>,
      {
        serviceName: string;
        url: string;
        host: string;
        method: string;
        group: string | null;
        dubboVersion: string;
        version: string | null;
        params: {type: string, value: string}[];
      }
    >({
      query: (args) => ({
        url: '/dubbo/test',
        method: 'post',
        body: args,
      }),
    }),
  }),
});

export const {
  useGetRegistryGroupsQuery,
  useGetDubboServicesQuery,
  useGetDubboInstancesQuery,
  useLazyGetDubboInstancesQuery,
  useTestInstanceMutation,
  useLazyQueryDubboProvidersQuery,
  useCheckServiceMutation,
} = dubboApi;
