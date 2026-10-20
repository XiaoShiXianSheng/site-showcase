const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const baseURL = process.env.SITE_BASE_URL || 'http://127.0.0.1:4173';
const routes = [
  { slug: 'home', path: '/', title: /Northbeam Studio/, text: /Websites that win/ },
  { slug: 'factory', path: '/factory/', title: /Norvane Cookware/, text: /Cookware built for/ },
  { slug: 'dtc', path: '/dtc/', title: /KUMO Flask/, text: /Ice-cold for 24 hours/ },
  { slug: 'restaurant', path: '/restaurant/', title: /Casa Ember/, text: /Fire\. Masa\.Familia\./ },
  { slug: 'knot-pop', path: '/games/knot-pop/', title: /Knot Pop/, text: null },
  { slug: 'cn-local', path: '/cn-local/', title: /本地实体店样站/, text: /本地实体店样站/ }
];

async function revealScrollContent(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
}

test.beforeEach(() => {
  fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
});

for (const route of routes) {
  test(`desktop route loads: ${route.slug}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(new URL(route.path, baseURL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(route.title);
    if (route.text) {
      await expect(page.locator('body')).toContainText(route.text);
    }
    if (route.slug === 'knot-pop') {
      await expect(page.locator('canvas')).toHaveCount(1);
    }
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    const externalScripts = await page.locator('script[src]').evaluateAll(nodes =>
      nodes.map(node => node.src).filter(src => new URL(src).origin !== location.origin)
    );
    expect(externalScripts, 'external script sources should be reviewed explicitly').toEqual([]);
    await revealScrollContent(page);
    await page.screenshot({ path: path.join(process.cwd(), 'artifacts', `${route.slug}-desktop.png`), fullPage: true });
    expect(pageErrors, 'uncaught browser errors').toEqual([]);
  });

  test(`mobile route has no horizontal overflow: ${route.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(new URL(route.path, baseURL).toString(), { waitUntil: 'domcontentloaded' });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth
    }));
    expect(dimensions.width, `horizontal overflow at ${route.path}`).toBeLessThanOrEqual(dimensions.viewport + 1);
    await revealScrollContent(page);
    await page.screenshot({ path: path.join(process.cwd(), 'artifacts', `${route.slug}-mobile.png`), fullPage: true });
  });
}

test('factory inquiry is a demo-only form and does not navigate to an external endpoint', async ({ page }) => {
  const externalRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin && ['POST', 'PUT', 'PATCH'].includes(request.method())) {
      externalRequests.push(request.url());
    }
  });
  await page.goto(new URL('/factory/', baseURL).toString(), { waitUntil: 'domcontentloaded' });
  const form = page.locator('form[data-demo]');
  await expect(form).toHaveCount(1);
  await form.locator('[aria-label="name"]').fill('QA Demo');
  await form.locator('[aria-label="email"]').fill('qa@example.com');
  await form.getByRole('button', { name: /Send Inquiry/ }).click();
  await expect(form.locator('.ok')).toBeVisible();
  await expect(form.locator('.ok')).toContainText(/Demo site.*form not connected/i);
  expect(externalRequests).toEqual([]);
});

test('DTC add-to-cart clearly states no real checkout', async ({ page }) => {
  await page.goto(new URL('/dtc/', baseURL).toString(), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Add to Cart – Free Shipping/ }).click();
  await expect(page.locator('.toast')).toContainText(/demo store, no real checkout/i);
});

test('static HTML has no obvious embedded credentials or external script tags', async () => {
  const files = routes.map(route => route.path === '/'
    ? path.join(process.cwd(), 'index.html')
    : path.join(process.cwd(), route.path.replace(/^\//, '').replace(/\/$/, ''), 'index.html'));
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    expect(html).not.toMatch(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
    expect(html).not.toMatch(/\bAKIA[0-9A-Z]{16}\b/);
    expect(html).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
    expect(html).not.toMatch(/<script\b[^>]*src=["']https?:\/\//i);
  }
});
