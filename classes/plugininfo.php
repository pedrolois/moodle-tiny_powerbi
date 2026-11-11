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

namespace tiny_powerbi;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;
use editor_tiny\plugin_with_menuitems;
use filter_powerbi\local\api;
use filter_powerbi\local\embed;

/**
 * Tiny Power BI plugin definition.
 *
 * @package   tiny_powerbi
 * @copyright 2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements plugin_with_buttons, plugin_with_configuration, plugin_with_menuitems {
    /**
     * Shown to users who may insert reports, while the Power BI filter is on.
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return bool
     */
    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): bool {
        return has_capability('tiny/powerbi:insert', $context)
            && isset(filter_get_globally_enabled()['powerbi']);
    }

    /**
     * Toolbar buttons.
     *
     * @return string[]
     */
    public static function get_available_buttons(): array {
        return ['tiny_powerbi/insert'];
    }

    /**
     * Menu items.
     *
     * @return string[]
     */
    public static function get_available_menuitems(): array {
        return ['tiny_powerbi/insert'];
    }

    /**
     * Configuration passed to the JavaScript plugin.
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return array
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        $filters = [];
        foreach (embed::get_filter_options() as $value => $label) {
            $filters[] = ['value' => $value, 'label' => $label];
        }
        return [
            'contextid' => $context->id,
            'canbrowse' => api::is_configured(),
            'defaultmode' => get_config('filter_powerbi', 'defaultmode') ?: embed::MODE_SECURE,
            'filters' => $filters,
        ];
    }
}
