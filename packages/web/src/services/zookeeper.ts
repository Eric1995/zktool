import { Res } from '@/types/dto';
import { ZookeeperDto, ZookeeperNodeDto } from '@/types/dto/zookeeper';
import splitApi from '.';

const withTags = splitApi.enhanceEndpoints({
  addTagTypes: ['zookeeperList', 'QueryZkNodeData'],
});

const zookeeperApi = withTags.injectEndpoints({
  endpoints: (build) => ({
    getZookeeperList: build.query<Res<ZookeeperDto[]>, void>({
      query: () => ({
        url: '/zookeeper/allZk',
      }),
      providesTags: ['zookeeperList'],
    }),
    getZkNode: build.query<Res<ZookeeperNodeDto>, Record<string, string>>({
      query: (params) => ({
        url: '/zookeeper/node',
        params,
      }),
    }),
    getZkNodeData: build.query<Res<string | null>, { zkAddress: string; path: string }>({
      query: (params) => ({
        url: '/zookeeper/node/data',
        params,
      }),
      providesTags: (result, error, arg) => {
        if (result) {
          return [{ type: 'QueryZkNodeData', id: arg.path }];
        }
        return [];
      },
    }),
    queryNodeChildren: build.mutation<Res<ZookeeperNodeDto[]>, Record<string, any>>({
      query: (payload) => ({
        method: 'POST',
        url: '/zookeeper/children',
        body: payload,
      }),
    }),
    deleteZookeeper: build.mutation<Res<string>, string>({
      query: (address) => ({
        url: '/zookeeper/delete',
        method: 'delete',
        params: {
          address,
        },
      }),
      invalidatesTags: ['zookeeperList'],
    }),
    addZookeeper: build.mutation<Res<string>, string>({
      query: (address) => ({
        url: '/zookeeper/save',
        method: 'get',
        params: {
          address,
        },
      }),
      invalidatesTags: ['zookeeperList'],
    }),
    connectZookeeper: build.mutation<Res<string>, string>({
      query: (address) => ({
        url: '/zookeeper/reconnect',
        params: { address },
      }),
      invalidatesTags: ['zookeeperList'],
    }),
    createNode: build.mutation<Res<string>, { zkAddress: string; body: Record<string, unknown> }>({
      query: ({ zkAddress, body }) => ({
        url: '/zookeeper/node/create',
        method: 'post',
        params: { zkAddress },
        body,
      }),
    }),
    setData: build.mutation<Res<ZookeeperNodeDto['stat']>, { zkAddress: string; body: { path: string; data: string | null; version: number } }>({
      query: ({ zkAddress, body }) => ({
        url: '/zookeeper/node/setData',
        method: 'post',
        params: { zkAddress },
        body,
      }),
      invalidatesTags: (_result, _error, arg) => {
        return [{ type: 'QueryZkNodeData', id: arg.body.path }];
      },
    }),
    deleteZkNode: build.mutation<Res<string>, { zkAddress: string; path: string }>({
      query: (params) => ({
        url: '/zookeeper/node/delete',
        method: 'delete',
        params,
      }),
    }),
  }),
});

export const {
  useGetZookeeperListQuery,
  useLazyGetZookeeperListQuery,
  useLazyGetZkNodeQuery,
  useQueryNodeChildrenMutation,
  useDeleteZookeeperMutation,
  useAddZookeeperMutation,
  useConnectZookeeperMutation,
  useLazyGetZkNodeDataQuery,
  useGetZkNodeDataQuery,
  useCreateNodeMutation,
  useDeleteZkNodeMutation,
  useSetDataMutation,
} = zookeeperApi;
