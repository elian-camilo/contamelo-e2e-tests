#!/usr/bin/env node
/**
 * Builds the HTML body for the CI result email (sent via Resend in
 * .github/workflows/e2e.yml). Reads the Playwright JSON reporter output
 * (test-results.json) and renders a per-test summary table with pass/fail
 * colors and a short error snippet for failures.
 *
 * Usage: node scripts/build-email-html.js [path/to/test-results.json] > out.html
 * Env vars consumed: ENVIRONMENT, TIER, RESULT, RUN_URL
 */
const fs = require('fs');

const resultsPath = process.argv[2] || 'test-results.json';
const ENVIRONMENT = process.env.ENVIRONMENT || '';
const TIER = process.env.TIER || '';
const RESULT = process.env.RESULT || '';
const RUN_URL = process.env.RUN_URL || '';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Strip ANSI escape codes Playwright embeds in error messages, keep it short.
function shortError(message) {
  if (!message) return '';
  // eslint-disable-next-line no-control-regex
  const clean = message.replace(/\[[0-9;]*m/g, '').trim();
  const firstLines = clean.split('\n').slice(0, 3).join('\n');
  return firstLines.length > 300 ? firstLines.slice(0, 300) + '…' : firstLines;
}

/** Flattens Playwright's nested suites → specs → tests → results into rows. */
function collectRows(suites, titlePath = []) {
  const rows = [];
  for (const suite of suites || []) {
    const path = suite.title ? [...titlePath, suite.title] : titlePath;
    for (const spec of suite.specs || []) {
      const name = [...path, spec.title].filter(Boolean).join(' › ');
      for (const test of spec.tests || []) {
        const result = test.results?.[test.results.length - 1];
        rows.push({
          name,
          project: test.projectName || '',
          status: result?.status || test.status || 'unknown',
          duration: result?.duration ?? 0,
          error: shortError(result?.error?.message),
        });
      }
    }
    rows.push(...collectRows(suite.suites, path));
  }
  return rows;
}

let rows = [];
let statsLine = '';
let globalErrors = [];
try {
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  rows = collectRows(data.suites);
  const s = data.stats || {};
  statsLine = `${s.expected ?? 0} passed, ${s.unexpected ?? 0} failed, ${s.flaky ?? 0} flaky, ${s.skipped ?? 0} skipped`;
  // When the whole run blows up before any test executes (syntax error in a
  // spec, a throwing globalSetup, etc.), Playwright leaves suites/stats empty
  // and puts the real reason in this top-level array instead — exactly the
  // case where the email needs to say something, not "0 passed, 0 failed".
  globalErrors = (data.errors || []).map((e) => shortError(e.message || String(e)));
} catch (err) {
  statsLine = `Could not read ${resultsPath}: ${err.message}`;
}

const rowsHtml = rows
  .map((r) => {
    const pass = r.status === 'passed';
    const color = pass ? '#1a7f37' : '#cf222e';
    const bg = pass ? '#dafbe1' : '#ffebe9';
    const errorHtml = r.error
      ? `<pre style="margin:4px 0 0;white-space:pre-wrap;font-size:12px;color:#57606a;">${escapeHtml(r.error)}</pre>`
      : '';
    return `
      <tr>
        <td style="padding:6px 10px;border:1px solid #d0d7de;">${escapeHtml(r.name)}${errorHtml}</td>
        <td style="padding:6px 10px;border:1px solid #d0d7de;">${escapeHtml(r.project)}</td>
        <td style="padding:6px 10px;border:1px solid #d0d7de;background:${bg};color:${color};font-weight:bold;">${escapeHtml(r.status)}</td>
        <td style="padding:6px 10px;border:1px solid #d0d7de;">${(r.duration / 1000).toFixed(1)}s</td>
      </tr>`;
  })
  .join('');

const table = rows.length
  ? `
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:13px;width:100%;">
      <thead>
        <tr style="background:#f6f8fa;">
          <th style="padding:6px 10px;border:1px solid #d0d7de;text-align:left;">Test</th>
          <th style="padding:6px 10px;border:1px solid #d0d7de;text-align:left;">Project</th>
          <th style="padding:6px 10px;border:1px solid #d0d7de;text-align:left;">Status</th>
          <th style="padding:6px 10px;border:1px solid #d0d7de;text-align:left;">Duration</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`
  : '<p style="font-family:sans-serif;color:#57606a;">No per-test results available.</p>';

const globalErrorsHtml = globalErrors.length
  ? `
    <div style="margin:12px 0;padding:10px;border:1px solid #ffc1c1;background:#ffebe9;">
      <p style="margin:0 0 6px;font-weight:bold;color:#cf222e;">Run failed before any test executed:</p>
      ${globalErrors
        .map((e) => `<pre style="margin:4px 0;white-space:pre-wrap;font-size:12px;color:#57606a;">${escapeHtml(e)}</pre>`)
        .join('')}
    </div>`
  : '';

const html = `
<div style="font-family:sans-serif;font-size:14px;">
  <p>Environment: <b>${escapeHtml(ENVIRONMENT)}</b></p>
  <p>Tier: <b>${escapeHtml(TIER)}</b></p>
  <p>Result: <b>${escapeHtml(RESULT)}</b></p>
  <p>${escapeHtml(statsLine)}</p>
  ${globalErrorsHtml}
  ${table}
  <p style="margin-top:16px;"><a href="${escapeHtml(RUN_URL)}">View full run (traces, screenshots, HTML report)</a></p>
</div>`;

process.stdout.write(html);
