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

use core\http_client;
use core_external\external_api;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\Psr7\Response;

/**
 * Tests of the workspace, report and page lists of the editor dialogue.
 *
 * @package   tiny_powerbi
 * @category  test
 * @covers    \tiny_powerbi\external\browse
 * @copyright 2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(browse::class)]
final class browse_test extends \advanced_testcase {
    /**
     * Configure the app registration and answer the HTTP calls with these JSON bodies.
     *
     * @param array $bodies
     */
    private function mock(array $bodies): void {
        set_config('tenantid', '99999999-8888-7777-6666-555555555555', 'filter_powerbi');
        set_config('clientid', '12345678-1234-1234-1234-123456789012', 'filter_powerbi');
        set_config('clientsecret', 'secret', 'filter_powerbi');
        $responses = array_map(
            fn($body) => new Response(200, ['Content-Type' => 'application/json'], json_encode($body)),
            $bodies
        );
        \core\di::set(http_client::class, new http_client(['mock' => new MockHandler($responses)]));
    }

    /**
     * Workspaces, then reports, then pages in their order.
     *
     * @covers \tiny_powerbi\external\browse
     */
    public function test_execute(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $context = \core\context\course::instance($course->id);
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));
        $this->mock([
            ['access_token' => 'AAA', 'expires_in' => 3600],
            ['value' => [['id' => 'g1', 'name' => 'Moodle reports']]],
            ['value' => [['id' => 'r1', 'name' => 'Enrolments']]],
            ['value' => [['name' => 'Page2', 'displayName' => 'Details', 'order' => 1],
                ['name' => 'Page1', 'displayName' => 'Overview', 'order' => 0]]],
        ]);

        $clean = fn($result) => external_api::clean_returnvalue(browse::execute_returns(), $result);
        $this->assertSame([['id' => 'g1', 'name' => 'Moodle reports']], $clean(browse::execute($context->id))['items']);
        $this->assertSame([['id' => 'r1', 'name' => 'Enrolments']], $clean(browse::execute($context->id, 'g1'))['items']);
        $pages = $clean(browse::execute($context->id, 'g1', 'r1'))['items'];
        $this->assertSame(['Overview', 'Details'], array_column($pages, 'name'));
    }

    /**
     * Students cannot list reports.
     *
     * @covers \tiny_powerbi\external\browse
     */
    public function test_requires_capability(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'student'));
        $this->expectException(\required_capability_exception::class);
        browse::execute(\core\context\course::instance($course->id)->id);
    }

    /**
     * Power BI errors are returned for the dialogue to show, not thrown.
     *
     * @covers \tiny_powerbi\external\browse
     */
    public function test_error(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $result = browse::execute(\core\context\system::instance()->id);
        $this->assertSame([], $result['items']);
        $this->assertSame(get_string('error:notconfigured', 'filter_powerbi'), $result['error']);
    }
}
