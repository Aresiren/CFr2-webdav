import { Env } from '../types';
import { handleWebDAV } from './webdavHandler';
import { authenticate } from '../utils/auth';
import { setCORSHeaders } from '../utils/cors';
import { logger } from '../utils/logger';

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const { BUCKET, BUCKET_NAME, IP_WHITELIST_SWITCH, IP_WHITELIST_REGEX } = env;  // 从 env 中获取 BUCKET 和 BUCKET_NAME
	const url = new URL(request.url);
	const originHostname = url.hostname;
  if(IP_WHITELIST_SWITCH == 1){//是否开启 ip白名单：1-开启
		if(IP_WHITELIST_REGEX &&
          !new RegExp(IP_WHITELIST_REGEX).test(
            request.headers.get("cf-connecting-ip")
          )){
				return URL302
          ? Response.redirect(URL302, 302)
          : new Response(await nginx(), {
              headers: {
                "Content-Type": "text/html; charset=utf-8",
              },
            });
		}
	}
	
  try {
    if (request.method !== "OPTIONS" && !authenticate(request, env)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="WebDAV"'
        }
      });
    }

    // 直接传递整个 env 对象给 handleWebDAV
    const response = await handleWebDAV(request, env);

    setCORSHeaders(response, request);
    return response;
  } catch (error) {
    logger.error("Error in request handling:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function nginx() {
  return `<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>`;
}
