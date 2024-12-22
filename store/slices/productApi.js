import { apiSlice } from "../api/apiSlice";

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchProducts: builder.query({
      query: (searchTerm) =>
        `/product?${searchTerm ? `search=${searchTerm}` : ""}`,
      providesTags: ["products"],
    }),

    fetchSingleProducts: builder.query({
      query: (id) => `/product/${id}`,
    }),

    addProduct: builder.mutation({
      query: (product) => ({
        url: "/product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["products"],
    }),

    updateProduct: builder.mutation({
      query: (product) => ({
        url: `/product`,
        method: "PUT",
        body: product,
      }),
      invalidatesTags: ["products"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/product`,
        method: "DELETE",
        body: id,
      }),
      invalidatesTags: ["products"],
    }),
  }),
});

export const {
  useAddProductMutation,
  useDeleteProductMutation,
  useFetchProductsQuery,
  useFetchSingleProductsQuery,
  useUpdateProductMutation,
} = productsApi;
