@editor @editor_tiny @tiny @tiny_powerbi @javascript
Feature: Insert Power BI reports from the TinyMCE editor
  In order to show live reports in my course
  As a teacher
  I need to insert Power BI reports from the editor

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course 1 | C1        |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Terry     | Teacher  | teacher1@example.com |
      | student1 | Sam       | Student  | student1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | C1     | editingteacher |
      | student1 | C1     | student        |
    # The editor is TinyMCE only for HTML content (contentformat 1).
    And the following "activities" exist:
      | activity | course | name         | content         | contentformat |
      | page     | C1     | Results page | <p>Results:</p> | 1             |
    And the "powerbi" filter is "on"

  Scenario: A teacher inserts a report filtered by the course
    Given I am on the "Results page" "page activity editing" page logged in as teacher1
    When I click on the "Power BI report" button for the "Page content" TinyMCE editor
    # One field at a time: "I set the following fields" would first try to expand the form behind the dialogue.
    And I set the field "Report link" in the "Power BI report" "dialogue" to "https://app.powerbi.com/groups/me/reports/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/ReportSection1"
    And I set the field "Title" in the "Power BI report" "dialogue" to "Course enrolments"
    And I set the field "Height (pixels)" in the "Power BI report" "dialogue" to "450"
    And I set the field "Filter the report by" in the "Power BI report" "dialogue" to "This course"
    And I set the field "Table" in the "Power BI report" "dialogue" to "Course Info"
    And I set the field "Column" in the "Power BI report" "dialogue" to "Short name"
    And I click on "Insert report" "button" in the "Power BI report" "dialogue"
    And I press "Save and display"
    Then "figure.filter-powerbi iframe[title='Course enrolments']" "css_element" should exist
    And "//figure[contains(@class,'filter-powerbi')]//iframe[contains(@src,'pageName=ReportSection1') and contains(@src,'Course_x0020_Info%2FShort_x0020_name%20eq%20%27C1%27')]" "xpath_element" should exist

  Scenario: A link that is not a Power BI report is refused
    Given I am on the "Results page" "page activity editing" page logged in as teacher1
    When I click on the "Power BI report" button for the "Page content" TinyMCE editor
    And I set the field "Report link" to "https://example.com/report"
    And I click on "Insert report" "button" in the "Power BI report" "dialogue"
    Then I should see "This is not a link to a Power BI report" in the "Power BI report" "dialogue"

  Scenario: The filter fields are asked only when filtering
    Given I am on the "Results page" "page activity editing" page logged in as teacher1
    When I click on the "Power BI report" button for the "Page content" TinyMCE editor
    Then "Table" "field" should not be visible
    And I set the field "Filter the report by" to "The viewer's groups in this course"
    And "Table" "field" should be visible
