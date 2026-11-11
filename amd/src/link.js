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
 * Read and write the links that mark Power BI reports in content (the same format filter_powerbi reads).
 *
 * @module     tiny_powerbi/link
 * @copyright  2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const GUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Defaults of the display options. */
export const DEFAULTS = {
    height: 600,
    mode: '',
    filterby: 'none',
    filtertable: '',
    filtercolumn: '',
    rlsrole: '',
    navpane: true,
    filterpane: false,
};

/**
 * Read a Power BI report link: the address of the report or its secure embed address.
 *
 * @param {String} value
 * @returns {Object|null} {groupid, reportid, pagename, tenantid, ...display options}, or null.
 */
export const parse = (value) => {
    let url;
    try {
        url = new URL(String(value).trim());
    } catch (e) {
        return null;
    }
    if (!/(^|\.)powerbi\.(com|cn|us|de)$/i.test(url.hostname)) {
        return null;
    }
    const q = url.searchParams;
    const result = {groupid: 'me', reportid: '', pagename: '', tenantid: ''};
    const path = new RegExp(`/groups/(me|${GUID})/reports/(${GUID})(?:/([^/?#]+))?`, 'i').exec(url.pathname);
    if (path) {
        result.groupid = path[1].toLowerCase();
        result.reportid = path[2].toLowerCase();
        result.pagename = path[3] || '';
    } else if (/\/reportEmbed$/i.test(url.pathname) && new RegExp(`^${GUID}$`, 'i').test(q.get('reportId') || '')) {
        result.reportid = q.get('reportId').toLowerCase();
        const group = q.get('groupId') || '';
        result.groupid = new RegExp(`^${GUID}$`, 'i').test(group) ? group.toLowerCase() : 'me';
        result.pagename = q.get('pageName') || '';
    } else {
        return null;
    }
    if (!/^[A-Za-z0-9_]{1,100}$/.test(result.pagename)) {
        result.pagename = '';
    }
    if (new RegExp(`^${GUID}$`, 'i').test(q.get('ctid') || '')) {
        result.tenantid = q.get('ctid').toLowerCase();
    }
    return {
        ...result,
        height: Number(q.get('mdlheight')) || DEFAULTS.height,
        mode: q.get('mdlmode') || DEFAULTS.mode,
        filterby: q.get('mdlfilter') || DEFAULTS.filterby,
        filtertable: q.get('mdltable') || '',
        filtercolumn: q.get('mdlcolumn') || '',
        rlsrole: q.get('mdlrole') || '',
        navpane: q.get('mdlnav') !== '0',
        filterpane: q.get('mdlfilters') === '1',
    };
};

/**
 * Build the link stored in content.
 *
 * @param {Object} report Result of parse(), with the display options chosen in the dialogue.
 * @returns {String}
 */
export const build = (report) => {
    const url = new URL(`https://app.powerbi.com/groups/${report.groupid}/reports/${report.reportid}` +
        (report.pagename ? `/${report.pagename}` : ''));
    const q = url.searchParams;
    if (report.tenantid) {
        q.set('ctid', report.tenantid);
    }
    if (Number(report.height) !== DEFAULTS.height) {
        q.set('mdlheight', String(Math.min(2000, Math.max(200, Number(report.height) || DEFAULTS.height))));
    }
    if (report.mode) {
        q.set('mdlmode', report.mode);
    }
    if (report.filterby !== 'none' && report.filtertable && report.filtercolumn) {
        q.set('mdlfilter', report.filterby);
        q.set('mdltable', report.filtertable);
        q.set('mdlcolumn', report.filtercolumn);
    }
    if (report.rlsrole) {
        q.set('mdlrole', report.rlsrole);
    }
    if (!report.navpane) {
        q.set('mdlnav', '0');
    }
    if (report.filterpane) {
        q.set('mdlfilters', '1');
    }
    return url.toString();
};
