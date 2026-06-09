// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/_next/static/*",
    "/favicon.ico"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\itz_k\\OneDrive\\Desktop\\Steward_production\\Steward-Admin\\.wrangler\\tmp\\pages-GfgIdD\\bundledWorker-0.4113180234114766.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\itz_k\\OneDrive\\Desktop\\Steward_production\\Steward-Admin\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\itz_k\\OneDrive\\Desktop\\Steward_production\\Steward-Admin\\.wrangler\\tmp\\pages-GfgIdD\\bundledWorker-0.4113180234114766.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=cj0dvj3qpq.js.map
