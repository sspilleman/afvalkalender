export type RouteHandler = (
  request: Request,
  // deno-lint-ignore no-explicit-any
  params: Record<string, any>,
  headers: Headers,
) => Promise<Headers | Response> | Response | Headers;
type Route = { pattern: URLPattern; handlers: RouteHandler[] };
type Routes = Record<Method, Route[]>;
type Method = "GET" | "PUT" | "POST" | "DELETE";
const methods: Method[] = ["GET", "POST", "PUT", "DELETE"];

// const AsyncFunction = (async (x: unknown) => await x).constructor;
// const AsyncFunction = (async function () {}).constructor;

export class Router {
  private notFound = new Response(null, { status: 404 });
  private routes: Routes = methods.reduce(
    (prev: Record<Method, Route[]>, cur: Method) => {
      prev[cur] = [];
      return prev;
    },
    {} as Routes,
  );

  private add(
    method: Method,
    pathname: string,
    handlers: RouteHandler[],
  ) {
    const pattern = new URLPattern({ pathname });
    this.routes[method].push({ pattern, handlers });
  }

  public get = (pathname: string, handlers: RouteHandler[]) =>
    this.add("GET", pathname, handlers);
  public post = (pathname: string, handlers: RouteHandler[]) =>
    this.add("POST", pathname, handlers);
  public put = (pathname: string, handlers: RouteHandler[]) =>
    this.add("PUT", pathname, handlers);
  public delete = (pathname: string, handlers: RouteHandler[]) =>
    this.add("DELETE", pathname, handlers);

  private findRoute(method: Method, url: string) {
    return this.routes[method as Method]
      .find((r) => r.pattern.test(url));
  }

  public async route(req: Request, headers: Headers): Promise<Response> {
    if (!this.routes[req.method as Method]) return this.notFound;
    const route = this.findRoute(req.method as Method, req.url);
    if (!route) return this.notFound;
    const params = route.pattern.exec(req.url)?.pathname.groups;
    if (!params) return this.notFound;
    for (const fn of route.handlers) {
      const result = await fn(req, params, headers);
      if (result.constructor === Headers) headers = result;
      if (result.constructor === Response) return result;
    }
    throw new Error(`${route.pattern.pathname} is not handled`);
  }
}

// if (
//   route.handler.constructor === Function ||
//   route.handler.constructor === AsyncFunction
// ) {
//   const handler = route.handler as RouteHandler;
//   const result = await handler(req, params, headers);
//   if (result.constructor === Response) return result;
// }
