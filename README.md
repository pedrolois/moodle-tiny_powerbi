# Power BI button for the TinyMCE editor (tiny_powerbi)

Adds a **Power BI report** button to the Moodle text editor, so teachers and course designers can place
live, interactive Power BI reports in any content: pages, labels, books, course summaries and more.

The reports are shown by the companion filter,
[**filter_powerbi**](https://github.com/pedrolois/moodle-filter_powerbi), which this plugin requires.
The filter's README explains the set-up in Power BI, the two display modes, and row-level security.

---

## Requirements

- Moodle **4.5** or later.
- [filter_powerbi](https://github.com/pedrolois/moodle-filter_powerbi), installed and turned on.
- A report published to the Power BI service (app.powerbi.com).

## Installation

1. Install **filter_powerbi** first.
2. Copy this plugin to `lib/editor/tiny/plugins/powerbi` (Moodle 5.1+:
   `public/lib/editor/tiny/plugins/powerbi`), or install it from
   *Site administration › Plugins › Install plugins*.
3. Visit *Site administration › Notifications* to finish the installation.

The button appears in the editor toolbar (next to the media buttons) and in the **Insert** menu, for
users with the capability `tiny/powerbi:insert` (managers, course creators and editing teachers by
default), while the Power BI filter is turned on.

## Insert a report

1. In Power BI, open the report and **copy its address** from the browser, for example
   `https://app.powerbi.com/groups/me/reports/88beecca-…/ece858b2…`.
   The address from *File › Embed report › Website or portal* works too.
2. In Moodle, edit the content and click the **Power BI report** button
   (or *Insert › Power BI report*).
3. Paste the link in **Report link**, give it a **Title**, and choose **Insert report**.
4. **Save**. The report appears when the content is displayed.

In the editor the report shows as a yellow box with its title. That box is a normal link, which the
filter turns into the live report when the page is displayed.

### Choose the report from a list

When an administrator has set up the embedded mode (see filter_powerbi), the dialogue also shows
**Or choose a report**: pick the **Workspace**, the **Report** and, optionally, the **Page**, and the
link and title are filled in for you.

### Edit a report

Click the report's box in the editor and click the **Power BI report** button again. The dialogue
opens with its current settings; change them and choose **Insert report**.

To remove a report, delete its box like any other text.

## The dialogue, field by field

| Field | What it does |
|---|---|
| **Report link** | Address of the report in Power BI. A specific page can be part of the link. |
| **Title** | Shown under the report and read by screen readers. |
| **Height (pixels)** | Between 200 and 2000. The width always fills the content area. |
| **Show the report** | *Site default*, *To people with access in Power BI* (secure embed: readers sign in with Microsoft), or *To everyone* (embedded: no sign-in or licence; only available when the administrator has set it up). |
| **Filter the report by** | *No filter*, *This course*, *The course category*, *The viewer's groups in this course*, *The viewer's cohorts*, *The user viewing it*, or a field of the viewer's profile (department, institution, city, country, ID number, and every custom profile field of the site). |
| **Table** and **Column** | With a filter: the table and column of the report's data model that hold that value, typed exactly as in Power BI (for example `Course Info` and `Short name`). |
| **Row-level security role** | Embedded mode only: the dataset role that limits each user to their own rows (see filter_powerbi). |
| **Show the page tabs** | Lets readers move between the report's pages. |
| **Show the filter pane** | Shows Power BI's own filter pane to readers. |

### Example: one report, every course

Build one report with a column holding each course's short name, and insert it with
*Filter the report by* › *This course*, *Table* `Course Info`, *Column* `Short name`. Put the same
report in every course: each course shows only its own figures.

### Example: each department sees its own

Build one report with a `Department` column, and insert it with *Filter the report by* ›
*The viewer's Department*. Every person who opens the page sees only their department's figures.
Someone in no department sees no data.

Filters by course or user make reports easier to read, but they are not a security boundary. To be
sure each user only sees their own data, use row-level security (embedded mode).

## Privacy

This plugin stores no personal data: it only inserts links to Power BI reports into content. See
filter_powerbi for what is sent to Power BI when reports are displayed.

## Licence

GNU GPL v3 or later.

Power BI is a trademark of Microsoft Corporation. This plugin is not affiliated with or endorsed by
Microsoft.
