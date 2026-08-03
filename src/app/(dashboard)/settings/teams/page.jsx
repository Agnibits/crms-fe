import { redirect } from "next/navigation";

/**
 * Teams is hidden from the settings navigation, but old links and bookmarks
 * still point here. Send them to Departments — the section that actually does
 * the grouping work today — rather than showing a page where a team can be
 * created, no member can be added to it, and the team lead means nothing.
 *
 * The Team table, routes and API are untouched. To bring the section back,
 * restore the nav entry in SettingsNav.jsx and replace this file with a real
 * page: membership on the user form, and a lead that reads leadUserId.
 */
export default function TeamsSettingsPage() {
  redirect("/settings/departments");
}
