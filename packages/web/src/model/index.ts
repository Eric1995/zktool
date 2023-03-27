import { configureStore } from '@reduxjs/toolkit';
import splitApi from '../services';

export const store = configureStore({
  reducer: {
    [splitApi.reducerPath]: splitApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(splitApi.middleware);
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
