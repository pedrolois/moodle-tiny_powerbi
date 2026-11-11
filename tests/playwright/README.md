# Power BI end-to-end tests

Browser tests with [Playwright](https://playwright.dev/) against a running Moodle site with
`tiny_powerbi` and `filter_powerbi` installed. They are not part of the Moodle plugin CI.

## What they check

- A teacher inserts a report filtered by the course; a student sees it, filtered by the course, with
  the right height and the **Full screen** button.
- The dialogue shows the saved options of an existing report, hides the table and column without a
  filter, and refuses links that are not Power BI reports.
- Students do not get the button.
- With a real report (optional): the **embedded mode** shows the live report without a Power BI sign-in.

## Before a run

`fixture.php` creates a temporary teacher and student with random passwords, a test course and a page.
After the run, everything is removed.

## Setup

```sh
cd lib/editor/tiny/plugins/powerbi/tests/playwright
npm install
npx playwright install chromium
```

Create `.env` (it is git-ignored):

```
MOODLE_URL=http://localhost/moodle
PHP_BINARY=/usr/bin/php
# Optional: a report the site's app registration can use, to test the embedded mode.
POWERBI_EMBEDDED_LINK=https://app.powerbi.com/groups/<workspace id>/reports/<report id>/<page>
```

## Run

```sh
npx playwright test
npx playwright test --headed
npx playwright show-report
```

To keep the test data after a run, set `TINY_POWERBI_E2E_KEEP=1`.
