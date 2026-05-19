import handler from "../dist/server/server.js";
import { Readable } from "node:stream";

export default async function (req, res) {
  try {
    const proto = req.headers["x-forwarded-proto"] ?? "https";
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const url = new URL(req.url, `${proto}://${host}`);

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val == null) continue;
      if (Array.isArray(val)) {
        for (const v of val) headers.append(key, v);
      } else {
        headers.set(key, val);
      }
    }

    const init = { method: req.method, headers };
    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }

    const request = new Request(url, init);
    const response = await handler.fetch(request);

    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("[api/server] fatal:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
