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

/**
 * Tests of when the button is offered and what it is told.
 *
 * @package   tiny_powerbi
 * @category  test
 * @copyright 2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(plugininfo::class)]
final class plugininfo_test extends \advanced_testcase {
    /**
     * Teachers get the button while the Power BI filter is on; students never.
     */
    public function test_is_enabled(): void {
        global $CFG;
        require_once($CFG->libdir . '/filterlib.php');
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $teacher = $generator->create_and_enrol($course, 'editingteacher');
        $student = $generator->create_and_enrol($course, 'student');
        $context = \core\context\course::instance($course->id);
        filter_set_global_state('powerbi', TEXTFILTER_ON);

        $this->setUser($teacher);
        $this->assertTrue(plugininfo::is_enabled($context, [], []));
        $this->setUser($student);
        $this->assertFalse(plugininfo::is_enabled($context, [], []));

        filter_set_global_state('powerbi', TEXTFILTER_DISABLED);
        // The enabled filters are cached for the request; a new page would read them again.
        \cache::make_from_params(\cache_store::MODE_REQUEST, 'core_filter', 'global_filters')->purge();
        $this->setUser($teacher);
        $this->assertFalse(plugininfo::is_enabled($context, [], []));
    }

    /**
     * The editor learns whether reports can be browsed, the default mode and the filters offered.
     */
    public function test_configuration(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $context = \core\context\system::instance();

        $config = plugininfo::get_plugin_configuration_for_context($context, [], []);
        $this->assertFalse($config['canbrowse']);
        $this->assertSame('secure', $config['defaultmode']);
        $this->assertContains('course', array_column($config['filters'], 'value'));

        set_config('tenantid', '99999999-8888-7777-6666-555555555555', 'filter_powerbi');
        set_config('clientid', '12345678-1234-1234-1234-123456789012', 'filter_powerbi');
        set_config('clientsecret', 'secret', 'filter_powerbi');
        $this->assertTrue(plugininfo::get_plugin_configuration_for_context($context, [], [])['canbrowse']);
    }
}
