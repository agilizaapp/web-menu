export const API_ENDPOINTS = {
  product: {
    list: (config?: boolean) => `/product${config ? '?config=true' : ''}`,
    byId: (id: number, config?: boolean) => `/product/${id}${config ? '?config=true' : ''}`,
    menu: (id: number) => `/product/${id}/menu`,
  },
  // orders: {
  //   create: '/orders',
  //   byId: (id: number) => `/orders/${id}`,
  //   list: '/orders',
  //   updateStatus: (id: number) => `/orders/${id}/status`,
  // },
  // menu: {
  //   items: '/menu/items',
  //   categories: '/menu/categories',
  //   item: (id: number) => `/menu/items/${id}`,
  // },
  // payments: {
  //   createPix: '/payments/pix',
  //   checkStatus: (id: number) => `/payments/${id}/status`,
  // },
} as const;

export const API_CONFIG = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
} as const;