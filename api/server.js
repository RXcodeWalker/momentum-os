import handler from "../dist/server/server.js";

export default async function (req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
    duplex: "half",
  });

  const response = await handler.fetch(request);

  res.statusCode = response.status;
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value);
  }

  if (response.body) {
    const { Readable } = await import("node:stream");
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
}
