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

/**
 * Test data of the Power BI browser tests: created before a run, removed after it.
 *
 * Usage: php fixture.php create   prints a JSON object {users: {role: {username, password}}, courseid, cmid, shortname}
 *        php fixture.php delete   removes the accounts and the course
 *
 * The accounts get a random password, so no real person's account and no stored password are needed.
 *
 * @package   tiny_powerbi
 * @copyright 2026 Pedro Lois {@link https://github.com/pedrolois}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../../../../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->libdir . '/filterlib.php');
require_once($CFG->libdir . '/testing/generator/lib.php');

/** Prefix of the usernames and of the course short name. */
const TINY_POWERBI_E2E = 'tiny_powerbi_e2e_';

$action = $argv[1] ?? '';
\core\session\manager::set_user(get_admin());

/**
 * Remove the accounts and the course.
 */
function tiny_powerbi_e2e_delete(): void {
    global $DB;
    if ($course = $DB->get_record('course', ['shortname' => TINY_POWERBI_E2E . 'course'])) {
        delete_course($course, false);
    }
    foreach (['teacher', 'student'] as $role) {
        if ($user = $DB->get_record('user', ['username' => TINY_POWERBI_E2E . $role, 'deleted' => 0])) {
            delete_user($user);
        }
    }
}

if ($action === 'delete') {
    tiny_powerbi_e2e_delete();
    echo "{}\n";
    exit(0);
}

if ($action !== 'create') {
    fwrite(STDERR, "Usage: php fixture.php create|delete\n");
    exit(1);
}

// Start clean, in case an earlier run stopped half way.
tiny_powerbi_e2e_delete();
filter_set_global_state('powerbi', TEXTFILTER_ON);

$generator = testing_util::get_data_generator();
$course = $generator->create_course(['fullname' => 'Power BI test course', 'shortname' => TINY_POWERBI_E2E . 'course']);
$users = [];
foreach (['teacher' => 'editingteacher', 'student' => 'student'] as $key => $role) {
    $password = 'Pbi-' . random_string(16) . '!1';
    $user = $generator->create_user([
        'username' => TINY_POWERBI_E2E . $key,
        'password' => $password,
        'firstname' => ucfirst($key),
        'lastname' => 'Power BI',
        'email' => TINY_POWERBI_E2E . $key . '@example.com',
    ]);
    $generator->enrol_user($user->id, $course->id, $role);
    $users[$key] = ['username' => $user->username, 'password' => $password];
}
// Some sites have plugins that start the theme when an activity is created, which the generator refuses unless the
// theme is already running.
$PAGE->set_context(\core\context\system::instance());
$PAGE->initialise_theme_and_output();
$page = $generator->create_module('page', [
    'course' => $course->id,
    'name' => 'Power BI test page',
    'content' => '<p>Results:</p>',
    'contentformat' => FORMAT_HTML,
]);
rebuild_course_cache($course->id, true);

echo json_encode([
    'users' => $users,
    'courseid' => (int) $course->id,
    'cmid' => (int) $page->cmid,
    'shortname' => $course->shortname,
]) . "\n";
