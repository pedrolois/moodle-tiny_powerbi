<?php
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

namespace tiny_powerbi\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use filter_powerbi\local\api;

/**
 * List workspaces, the reports of a workspace, or the pages of a report.
 *
 * @package   tiny_powerbi
 * @copyright 2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class browse extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'Context the editor is used in'),
            'groupid' => new external_value(PARAM_ALPHANUMEXT, 'Workspace: list its reports', VALUE_DEFAULT, ''),
            'reportid' => new external_value(PARAM_ALPHANUMEXT, 'Report: list its pages', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * List the items.
     *
     * @param int $contextid
     * @param string $groupid
     * @param string $reportid
     * @return array
     */
    public static function execute(int $contextid, string $groupid = '', string $reportid = ''): array {
        [
            'contextid' => $contextid,
            'groupid' => $groupid,
            'reportid' => $reportid,
        ] = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'groupid' => $groupid,
            'reportid' => $reportid,
        ]);
        $context = \core\context::instance_by_id($contextid);
        self::validate_context($context);
        require_capability('tiny/powerbi:insert', $context);

        try {
            if ($groupid !== '' && $reportid !== '') {
                $items = api::list_pages($groupid, $reportid);
            } else if ($groupid !== '') {
                $items = api::list_reports($groupid);
            } else {
                $items = api::list_workspaces();
            }
        } catch (\moodle_exception $e) {
            return ['items' => [], 'error' => $e->getMessage()];
        }
        return ['items' => $items, 'error' => ''];
    }

    /**
     * Return structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'items' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_RAW, 'Workspace id, report id or page name'),
                'name' => new external_value(PARAM_TEXT, 'Display name'),
            ])),
            'error' => new external_value(PARAM_TEXT, 'Error from Power BI, if any'),
        ]);
    }
}
