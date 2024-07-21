/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as ItemsIndexImport } from './routes/items/index'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ItemsIndexRoute = ItemsIndexImport.update({
  path: '/items/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/items/': {
      id: '/items/'
      path: '/items'
      fullPath: '/items'
      preLoaderRoute: typeof ItemsIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({ IndexRoute, ItemsIndexRoute })

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/items/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/items/": {
      "filePath": "items/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */