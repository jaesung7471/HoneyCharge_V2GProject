import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () =>
          new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the GridFlow operations dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );

  const html = await response.text();
  assert.match(
    html,
    /<title>GridFlow \| 제주·호남 V2G 에너지 운영<\/title>/i,
  );
  assert.match(html, /제주.*V2G 통합 운영/);
  assert.match(html, /예상 재생에너지/);
  assert.match(html, /차량·스케줄/);
  assert.match(html, /시연용 추정값/);
  assert.doesNotMatch(
    html,
    /codex-preview|Your site is taking shape/i,
  );
});

test("renders owner and fleet experiences in the application shell", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /운영 대시보드/);
  assert.match(html, /차주 참여/);
  assert.match(html, /사용자 이동권/);
  assert.match(html, /규칙 기반/);
});
