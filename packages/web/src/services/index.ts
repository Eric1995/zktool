import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

const splitApi = createApi({
  keepUnusedDataFor: 0,
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    // baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/',
    prepareHeaders: (headers) => {
      const XHeader = window?.portal?.appGlobal.attributes?._csrf_header || null;
      if (XHeader && window.portal?.appGlobal.attributes._csrf) {
        headers.append(XHeader, window.portal?.appGlobal.attributes._csrf);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});
export default splitApi;
