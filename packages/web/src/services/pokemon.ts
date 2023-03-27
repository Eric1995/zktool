import splitApi from '.';

const pokemonApi = splitApi.injectEndpoints({
  endpoints: (build) => ({
    getPokemonByName: build.query<{ name: string }, string>({
      query: (name) => `pokemon/${name}`,
    }),
    queryIncidentList: build.mutation<{}, undefined>({
      query: () => ({
        url: 'sgp-itsm/incident/queryIncidentList',
        method: 'post',
        body: {},
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    postSaveIncident: build.mutation<{ data: any }, undefined>({
      query: (data) => ({
        url: 'sgp-itsm/incident/saveIncident',
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    postDictionary: build.mutation<{ data: any }, any>({
      query: (data) => ({
        url: '/sgp-itsm/dict/getDictionary',
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPokemonByNameQuery,
  useQueryIncidentListMutation,
  usePostSaveIncidentMutation,
  usePostDictionaryMutation,
} = pokemonApi;
