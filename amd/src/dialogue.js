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
 * Dialogue to insert or edit a Power BI report.
 *
 * @module     tiny_powerbi/dialogue
 * @copyright  2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import ModalSaveCancel from 'core/modal_save_cancel';
import ModalEvents from 'core/modal_events';
import Templates from 'core/templates';
import {call as fetchMany} from 'core/ajax';
import {get_string as getString, get_strings as getStrings} from 'core/str';
import {component} from './common';
import {getOptions} from './options';
import {DEFAULTS, build, parse} from './link';

/**
 * List workspaces, reports or pages through the site's app registration.
 *
 * @param {Number} contextid
 * @param {String} groupid
 * @param {String} reportid
 * @returns {Promise<{items: Array, error: String}>}
 */
const browse = (contextid, groupid = '', reportid = '') => fetchMany([{
    methodname: 'tiny_powerbi_browse',
    args: {contextid, groupid, reportid},
}])[0];

/**
 * Fill a select with items.
 *
 * @param {HTMLSelectElement} select
 * @param {Array} items [{id, name}]
 * @param {String} placeholder
 * @param {String} selected
 */
const fill = (select, items, placeholder, selected = '') => {
    select.innerHTML = '';
    select.append(new Option(placeholder, ''));
    items.forEach((item) => select.append(new Option(item.name, item.id, false, item.id === selected)));
    select.disabled = !items.length;
};

/**
 * Open the dialogue.
 *
 * @param {TinyMCE} editor
 */
export const openDialogue = async(editor) => {
    const options = getOptions(editor);
    const existing = editor.selection.getNode().closest('a.powerbi-embed');
    const current = (existing && parse(existing.getAttribute('href'))) || {...DEFAULTS};
    const title = existing ? existing.textContent.trim() : '';

    const labels = await getStrings(['mode:default', 'mode:secure', 'mode:embedded', 'choose'].map((key) => ({key, component})));
    const [modeDefault, modeSecure, modeEmbedded, choose] = labels;

    const context = {
        uniqid: `${editor.id}_powerbi`,
        link: existing ? existing.getAttribute('href') : '',
        title,
        height: current.height,
        filtertable: current.filtertable,
        filtercolumn: current.filtercolumn,
        rlsrole: current.rlsrole,
        navpane: current.navpane,
        filterpane: current.filterpane,
        canbrowse: options.canbrowse,
        modes: [
            {value: '', label: modeDefault, selected: !current.mode},
            {value: 'secure', label: modeSecure, selected: current.mode === 'secure'},
            {value: 'embedded', label: modeEmbedded, selected: current.mode === 'embedded', disabled: !options.canbrowse},
        ],
        // Offered by the server: course, category, groups, cohorts, the viewer and the site's profile fields.
        filters: options.filters.map((filter) => ({...filter, selected: filter.value === current.filterby})),
    };

    const modal = await ModalSaveCancel.create({
        title: getString('buttontitle', component),
        body: Templates.render('tiny_powerbi/dialogue', context),
        buttons: {save: getString('save', component)},
        large: true,
        removeOnClose: true,
        show: true,
    });
    // The body is rendered asynchronously: wait for it before looking for the fields.
    await modal.getBodyPromise();
    const root = modal.getRoot()[0];
    const field = (name) => root.querySelector(`[data-region="${name}"]`);

    // Show the filter and row-level security fields only when they apply.
    const refresh = () => {
        field('filterfields').classList.toggle('d-none', field('filterby').value === 'none');
        const mode = field('mode').value || options.defaultmode;
        field('rlsfields').classList.toggle('d-none', mode !== 'embedded');
    };
    root.addEventListener('change', refresh);
    refresh();

    if (options.canbrowse) {
        setupBrowse(root, field, options.contextid, choose, current);
    }

    modal.getRoot().on(ModalEvents.save, async(e) => {
        e.preventDefault();
        const error = field('error');
        error.innerHTML = '';
        const report = parse(field('link').value);
        if (!report) {
            error.innerHTML = `<div class="alert alert-danger mt-2 mb-0">${await getString('error:badlink', component)}</div>`;
            return;
        }
        Object.assign(report, {
            height: Number(field('height').value) || DEFAULTS.height,
            mode: field('mode').value,
            filterby: field('filterby').value,
            filtertable: field('filtertable').value.trim(),
            filtercolumn: field('filtercolumn').value.trim(),
            rlsrole: (field('mode').value || options.defaultmode) === 'embedded' ? field('rlsrole').value.trim() : '',
            navpane: field('navpane').checked,
            filterpane: field('filterpane').checked,
        });
        if (report.filterby !== 'none' && (!report.filtertable || !report.filtercolumn)) {
            error.innerHTML = `<div class="alert alert-danger mt-2 mb-0">${await getString('error:filterfields', component)}</div>`;
            return;
        }

        const link = document.createElement('a');
        link.className = 'powerbi-embed';
        link.href = build(report);
        link.textContent = field('reporttitle').value.trim() || await getString('buttontitle', component);

        editor.undoManager.transact(() => {
            if (existing) {
                editor.dom.setAttrib(existing, 'href', link.href);
                existing.textContent = link.textContent;
            } else {
                editor.insertContent(`<p>${link.outerHTML}</p><p></p>`);
            }
        });
        modal.destroy();
    });
};

/**
 * Workspace, report and page pickers, filled from Power BI; choosing them writes the report link.
 *
 * @param {HTMLElement} root
 * @param {Function} field
 * @param {Number} contextid
 * @param {String} choose Placeholder of the selects.
 * @param {Object} current Report being edited.
 */
const setupBrowse = async(root, field, contextid, choose, current) => {
    const workspace = field('workspace');
    const report = field('report');
    const page = field('page');
    const showError = (message) => {
        field('error').innerHTML = '';
        if (message) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-warning mt-2 mb-0';
            alert.textContent = message;
            field('error').appendChild(alert);
        }
    };
    const writeLink = () => {
        if (!workspace.value || !report.value) {
            return;
        }
        field('link').value = build({...DEFAULTS, groupid: workspace.value, reportid: report.value, pagename: page.value});
        if (!field('reporttitle').value.trim()) {
            field('reporttitle').value = report.selectedOptions[0]?.text || '';
        }
    };

    const workspaces = await browse(contextid);
    showError(workspaces.error);
    fill(workspace, workspaces.items, choose, current.groupid);

    workspace.addEventListener('change', async() => {
        fill(report, [], choose);
        fill(page, [], choose);
        if (workspace.value) {
            const reports = await browse(contextid, workspace.value);
            showError(reports.error);
            fill(report, reports.items, choose);
        }
    });
    report.addEventListener('change', async() => {
        fill(page, [], choose);
        if (report.value) {
            const pages = await browse(contextid, workspace.value, report.value);
            showError(pages.error);
            fill(page, pages.items, choose);
        }
        writeLink();
    });
    page.addEventListener('change', writeLink);
};
