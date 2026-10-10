export default async function(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const spec = `# ThriveNut - Complete Rebuild Specification

## 1. App Purpose
ThriveNut is an all-in-one goal, wellness, and lifestyle tracker for creators, families, and achievers. It serves as a unified hub offering modules for productivity (tasks, habits, goals), health & wellness, social media suite (creator CRM, engagement tracking, live schedules), content marketplace, AI tools, and group/community management (for agencies, families, businesses, and masterminds).

## 2. User Roles
- **Admin/Super Admin:** Has access to the Admin panel, can manage feature flags, global settings, shared communities, and impersonate other users.
- **Creator / Member (Default):** Standard user with access to their enabled modules, personal dashboard, and tasks.
- **Agency Owner / Manager:** Can manage groups (CreatorGroups), customize tabs, manage members, handle CRM/pipeline stages.
- **Client / Virtual Assistant:** Specific group roles with restricted access, often limited by group "Role Tab Permissions".
- **Superfan / Subscriber:** Paid or elevated status users with access to gated group features and specific AI tools.
- **Other Custom Roles / Tags:** Gifter, Battle Sniper, Tapper, IRL Friend, Discord Member, etc. (Used in Social Suite CRM).

## 3. Pages & Functionality
- **/Dashboard:** Main "My Day" view. Features widgets, daily motivations, calendar events, quick stats, and quick actions.
- **/CreatorGroups (My Groups):** Manage and view groups. Includes tabs for Feed, Discussion, Events, Meetings, Projects, Marketing, Assets, Resources, Training, Q&A, Members, and Requests.
- **/TikTokContacts (Creator Contacts):** Master CRM for networking. Tracks TikTok, Personal, and Business contacts. Supports custom roles, "Privacy Mode", CSV backup, and marking accounts for the daily engagement tracker.
- **/TikTokEngagement (Social Engagement):** Daily checklist to interact with linked contacts. Calculates due dates based on frequency (Daily, Specific Days, Monthly) and saves checkmarks to UserPreferences.
- **/SocialShortcuts:** Link-in-bio style dashboard for brands to group social network URLs (TikTok, YouTube, IG, Facebook) and auto-generates deep links (Analytics, Inbox, Live Stats).
- **/LiveSchedule (Creator Calendar):** Calendar mapping the user's own live/post schedule (ContentCalendarItem) alongside other creators' streams (LiveSchedule). Converts creator time to the viewer's local timezone.
- **/DiscoverCreators:** Directory of creators who shared their live schedules globally. Users can search by TikTok username and instantly add a schedule to their own calendar.
- **/Tasks, /Habits, /Goals, /QuickNotes, /Journal, /VisionBoard, /Finance:** Productivity and tracking modules with list/grid views, progress tracking, and goal sharing.
- **/MentalHealth, /Wellness, /Supplements, /Medications, /ActivityTracker, /PetCare, /CareReminders:** Health suite tracking daily intake, logs, elimination, mood, and sleep.
- **/ContentCreatorHub, /ContentMarketplace, /PromptLibrary, /TheCloset:** Creator studio tools for managing assets, selling/requesting content, and saving AI prompts.
- **/PrayerRequests, /HolyHitmakers:** Faith-based modules for sharing prayer requests and listening to AI-generated faith songs.
- **/SongGenerator, /AIGeneratorStudio:** AI suite utilizing NanoBanana/Suno and image generators for asset creation.
- **/Admin:** Backend management panel for Super Admins to monitor users, feature flags, approvals, and platform configuration.
- **/Profile & /Settings:** User configuration, onboarding, theme colors (primary, accent, menu), custom default landing page, and music player configuration.

## 4. Data Types (Entities) & Core Fields
*(Note: Excludes generic fields like id, created_date, updated_date, created_by_id)*
- **UserPreferences:** user_email, nickname, profile_image_url, primary_color, accent_color, menu_color, enabled_modules, default_landing_page, daily_engagement_log, custom_tiktok_roles, user_timezone, active_music_service, tiktok_access_approved.
- **CreatorGroup:** name, slug, description, owner_email, logo_url, type (agency, family, business, etc.), status, settings (JSON), member_levels, role_tab_permissions.
- **CreatorGroupMember:** group_id, user_email, role, level, status, joined_date, is_paid_member.
- **GroupEvent:** group_id, title, description, start_time, end_time, occurrences, target_levels.
- **TikTokContact:** username, display_name, real_name, role (Array), is_favorite, engagement_enabled, engagement_frequency, engagement_days, engagement_history, last_engaged_date, social_links (JSON).
- **LiveSchedule:** host_username, recurring_days, time, creator_timezone, live_types, is_recurring, specific_date.
- **ContentCalendarItem:** type, title, recurring_days, time, platforms, live_types, share_to_directory.
- **SocialBrand:** name, user_email.
- **SocialNetwork:** brand_id, platform, handle.
- **SocialShortcut:** network_id, title, url, sort_order.
- **Task / Habit / Goal:** title, details, status, due_date, priority, category, is_recurring, recurrence_pattern.
- **PixelBoard:** title, details, status, priority, category, card_color, thread.
- **AIConversationLog / AIAppOutput / GeneratedSong / ContentGenerationLog:** Logs for tracking API usage and outputs.
- *(Over 100 total entities spanning from MarketingAsset to MentalHealthProfile to Notification)*

## 5. Button Flows (Key Interactions)
- **Daily Engagement:** User clicks TikTok icon on engagement tracker -> Icon animates green -> Saves to \`UserPreferences.daily_engagement_log\`. If all linked accounts are clicked, pushes timestamp to \`TikTokContact.engagement_history\` and moves contact to bottom of list.
- **Group Settings / Feature Toggles:** Agency Owner navigates to Group Settings -> Features Tab -> Toggles "My Day" or "Creator Studio" -> Updates \`CreatorGroup.settings.agency_features\` -> React Query invalidates and instantly hides/shows side menu items for members.
- **Add to Calendar (Discover):** User searches Directory -> Clicks '+' -> App copies ContentCalendarItem into user's LiveSchedule -> Downloads .ics file to device.
- **Transfer Group Ownership:** Group Admin clicks Danger Zone -> Enters new owner email and confirms -> Calls \`transferGroupOwnership\` backend function -> Redirects to dashboard.
- **AI Task Generation:** User clicks "Generate Steps" on a Goal -> Calls \`askContentAI\` / \`InvokeLLM\` -> Returns structured JSON checklist -> Maps to Task entities.

## 6. Connections (Email, AI, Files, Payments, Connectors)
- **AI Connections:** Uses \`InvokeLLM\`, \`GenerateImage\`, \`GenerateSpeech\`, \`GenerateVideo\` via Base44 Core integrations (Google Gemini, OpenAI GPT, Anthropic Claude, etc.) utilizing secrets: \`GoogleAiStudio\`, \`GOOGLE_API_KEY\`, \`OPENAI_API_KEY\`.
- **Payments:** Stripe integration for marketing orders, subscriptions, and creator marketplace purchases (via \`stripeWebhook\`, \`createCheckout\`, \`createChildCheckout\` backend functions and \`STRIPE_API_KEY\` secret).
- **Files:** \`UploadPrivateFile\` and \`UploadPublicFile\` used for Group Logos, Assets, Receipts, Profile Images, and Quick-Add Ticket attachments.
- **OAuth Connectors:** Notion (for importing tasks) and Google Calendar (for syncing live schedules/group events). Identified by Workspace Connectors: \`googlecalendar\` and \`googledrive\`.

## 7. Backend Functions
- **Integrations & Sync:** \`addToGoogleCalendar\`, \`fetchGoogleCalendar\`, \`fetchPublicCalendar\`, \`fetchNotionTasks\`, \`importNotionBoard\`, \`syncAIToolUsers\`, \`syncNutsAndBotsUsers\`.
- **Groups & Members:** \`createCreatorGroup\`, \`deleteCreatorGroup\`, \`getGroupDetails\`, \`getUserGroups\`, \`notifyGroupMembers\`, \`transferGroupOwnership\`, \`updateMemberStatus\`, \`setAdminGroupLimits\`, \`seedGroupTypes\`.
- **AI & Content:** \`analyzeBattleScreenshot\`, \`askContentAI\`, \`askGroupAI\`, \`generateAIGreeting\`, \`generateGifterSong\`, \`generateImageWithDimensions\`, \`generateImageWithNanoBanana\`, \`generateMarketingContent\`, \`scanRecipe\`.
- **Commerce & Billing:** \`assignCoupon\`, \`checkSubscription\`, \`checkTrialStatus\`, \`createCheckout\`, \`createChildCheckout\`, \`processMarketingPayment\`, \`recordAIPurchase\`, \`stripeWebhook\`.
- **Data Utilities:** \`bulkEnableSocial\`, \`canonicalMerge\`, \`cleanupDuplicatePreferences\`, \`cleanupPixelBoard\`, \`clearReferralActivity\`, \`createAsUser\`, \`createPixelBoardCard\`, \`debugOrphans\`, \`debugUserPreferences\`, \`deletePixelBoardCard\`, \`deletePixelBoardCards\`, \`exportLinksCsv\`, \`fetchCryptoPrices\`, \`fetchGroupResources\`, \`fetchPublicSheetCsv\`, \`fetchPublicTikTokStats\`, \`fetchSharedResources\`, \`forceDeleteReferralActivity\`, \`generateReferralCode\`, \`getGroupAnnouncements\`, \`getNotificationData\`, \`getPublicGroups\`, \`getPublicProfile\`, \`healUserPreferences\`, \`initializeReferralCode\`, \`kidControls\`, \`migrateFunnelContent\`, \`migrationSimulation\`, \`processAccountDeletion\`, \`profile\`, \`redeemGift\`, \`searchMasterContacts\`, \`seedPixelBoard\`, \`sendBatch\`, \`sharedInventory\`, \`trackReferral\`, \`updatePixelBoard\`, \`verifyRealUser\`.

## 8. Secrets / Settings
- \`GoogleAiStudio\`
- \`GOOGLE_API_KEY\`
- \`STRIPE_API_KEY\`
- \`OPENAI_API_KEY\`

## 9. Unfinished / Disabled / Future Work
- **Quick-Add Contact Creation:** Disabled in \`TikTokContacts.jsx\` for launch safety (restricted to admin-only via Admin Panel). The function \`handleQuickAddContact\` is preserved but unused.
- **Growth Tracker Widget:** The \`TikTokStatsWidget\` component is commented out in the Social Engagement tracker (\`{/* My Growth Tracker - Hidden per user request */}\`).
`;

  return res.json({
    app: "ThriveNut",
    spec: spec
  });
}