// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Power BI reports from the editor to the page: insert, edit, filter, full screen, and (with a real report) the
 * embedded mode.
 *
 * @copyright  2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const fixture = () => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.auth', 'fixture.json'), 'utf8'));
const REPORT = 'https://app.powerbi.com/groups/me/reports/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/ReportSection1';

/**
 * Log in with a test account.
 *
 * @param {Page} page
 * @param {String} role
 */
const login = async(page, role) => {
    const user = fixture().users[role];
    await page.goto('login/index.php?showcore=1&lang=en');
    await page.fill('#username', user.username);
    await page.fill('#password', user.password);
    await Promise.all([page.waitForURL((url) => !url.pathname.endsWith('/login/index.php')), page.click('#loginbtn')]);
};

/**
 * Open the page editor and the Power BI dialogue.
 *
 * @param {Page} page
 * @returns {Promise<Locator>} The dialogue.
 */
const openDialogue = async(page) => {
    await page.goto(`course/modedit.php?update=${fixture().cmid}&lang=en`);
    const editor = page.locator('.tox-tinymce').filter({has: page.locator('iframe[id^="id_page"]')}).first();
    await page.frameLocator('iframe[id^="id_page"]').locator('p').last().click();
    let button = editor.locator('button[aria-label="Power BI report"]');
    if (!(await button.isVisible())) {
        await editor.locator('button[aria-label="Reveal or hide additional toolbar items"]').click();
        button = page.locator('button[aria-label="Power BI report"]');
    }
    await button.click();
    const dialog = page.locator('.modal-content').filter({hasText: 'Power BI report'});
    await expect(dialog.locator('[data-region="link"]')).toBeVisible();
    return dialog;
};

test.describe.serial('Power BI reports', () => {
    // Each test logs in once or twice and saves a page: give slow sites time.
    test.describe.configure({timeout: 240000});

    test('a teacher inserts a report filtered by the course and a student sees it', async({browser}) => {
        const teacher = await browser.newPage();
        await login(teacher, 'teacher');
        const dialog = await openDialogue(teacher);
        await dialog.locator('[data-region="link"]').fill(REPORT);
        await dialog.locator('[data-region="reporttitle"]').fill('Course enrolments');
        await dialog.locator('[data-region="height"]').fill('450');
        await dialog.locator('[data-region="filterby"]').selectOption('course');
        await dialog.locator('[data-region="filtertable"]').fill('Course Info');
        await dialog.locator('[data-region="filtercolumn"]').fill('Short name');
        await dialog.locator('[data-action="save"]').click();
        await expect(dialog).toBeHidden();

        const link = teacher.frameLocator('iframe[id^="id_page"]').locator('a.powerbi-embed');
        await expect(link).toHaveText('Course enrolments');
        await expect(link).toHaveAttribute('href', /mdlfilter=course/);
        await Promise.all([teacher.waitForLoadState('load'), teacher.click('#id_submitbutton')]);

        const student = await browser.newPage();
        await login(student, 'student');
        await student.goto(`mod/page/view.php?id=${fixture().cmid}&lang=en`);
        const frame = student.locator('figure.filter-powerbi iframe[title="Course enrolments"]');
        await expect(frame).toHaveCount(1);
        const src = decodeURIComponent(await frame.getAttribute('src'));
        expect(src).toContain('pageName=ReportSection1');
        expect(src).toContain(`filter=Course_x0020_Info/Short_x0020_name eq '${fixture().shortname}'`);
        await expect(student.locator('figure.filter-powerbi .filter-powerbi-frame')).toHaveCSS('height', '450px');
        await expect(student.getByRole('button', {name: 'Full screen'})).toBeVisible();
    });

    test('the dialogue edits an existing report and refuses other links', async({page}) => {
        await login(page, 'teacher');
        await page.goto(`course/modedit.php?update=${fixture().cmid}&lang=en`);
        await page.frameLocator('iframe[id^="id_page"]').locator('a.powerbi-embed').click();
        const editor = page.locator('.tox-tinymce').filter({has: page.locator('iframe[id^="id_page"]')}).first();
        await editor.locator('button[aria-label="Power BI report"]').click();
        const dialog = page.locator('.modal-content').filter({hasText: 'Power BI report'});

        // The saved options are back in the dialogue.
        await expect(dialog.locator('[data-region="reporttitle"]')).toHaveValue('Course enrolments');
        await expect(dialog.locator('[data-region="filterby"]')).toHaveValue('course');
        await expect(dialog.locator('[data-region="filtertable"]')).toHaveValue('Course Info');

        // The table and column only matter with a filter.
        await dialog.locator('[data-region="filterby"]').selectOption('none');
        await expect(dialog.locator('[data-region="filtertable"]')).toBeHidden();

        await dialog.locator('[data-region="link"]').fill('https://example.com/report');
        await dialog.locator('[data-action="save"]').click();
        await expect(dialog.getByRole('alert')).toContainText('This is not a link to a Power BI report');
    });

    test('a student does not get the button', async({page}) => {
        await login(page, 'student');
        await page.goto(`user/edit.php?lang=en`);
        await expect(page.locator('.tox-tinymce').first()).toBeVisible();
        await expect(page.locator('button[aria-label="Power BI report"]')).toHaveCount(0);
    });

    // Needs the app registration set up on the site and a report it can use (POWERBI_EMBEDDED_LINK in .env).
    test('the embedded mode shows a live report without a Power BI sign-in', async({browser}) => {
        test.skip(!process.env.POWERBI_EMBEDDED_LINK, 'Set POWERBI_EMBEDDED_LINK in .env to test with a real report');
        const teacher = await browser.newPage();
        await login(teacher, 'teacher');
        const dialog = await openDialogue(teacher);
        await dialog.locator('[data-region="link"]').fill(process.env.POWERBI_EMBEDDED_LINK);
        await dialog.locator('[data-region="reporttitle"]').fill('Live report');
        await dialog.locator('[data-region="mode"]').selectOption('embedded');
        await dialog.locator('[data-action="save"]').click();
        const answers = [];
        teacher.on('response', (response) => {
            if (response.url().includes('filter_powerbi_get_embed')) {
                answers.push(response.status());
            }
        });
        // Save and display: the browser has no Power BI session, so only Moodle's token can show the report.
        await Promise.all([teacher.waitForLoadState('load'), teacher.click('#id_submitbutton')]);
        const figure = teacher.locator('figure.filter-powerbi').filter({hasText: 'Live report'});
        await expect(figure.locator('iframe')).toHaveCount(1, {timeout: 60000});
        // The token came from Moodle and Power BI loaded the report: the loading message is gone.
        await expect(figure.locator('[data-region="status"]')).toHaveCount(0, {timeout: 60000});
        expect(answers).toContain(200);
    });
});
