# Boolforge Platform Redesign Architecture

## 1. Full redesign strategy

### Product direction

Boolforge should evolve from a content-heavy landing page with embedded tools into a structured learning platform with three clear product surfaces:

1. `Learn`
   Topic-first guided learning for Boolean algebra, number systems, arithmetic, combinational circuits, sequential circuits, registers, memory, and advanced logic.
2. `Problems`
   A dedicated LeetCode-style practice workspace with searchable problems, progress analytics, filters, and activity tracking.
3. `Profile`
   User-specific progress, streaks, achievements, recent activity, saved lists, and completion overview.

### Repo-grounded current-state assessment

Based on the current frontend:

- Problems are embedded inside the home page via [`src/pages/Home/Home.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/Home.jsx:9) and [`src/pages/Problems/ProblemsSection.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Problems/ProblemsSection.jsx:1).
- Problem data is local/static in [`src/pages/Problems/ProblemsData.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Problems/ProblemsData.js:1).
- Progress integration is minimal and only exposes one endpoint in [`src/services/progressService.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/services/progressService.js:1).
- Auth is already session-aware and should be preserved through [`src/context/AuthContext.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/context/AuthContext.jsx:1) and [`src/services/authService.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/services/authService.js:1).
- The most mature visual system already exists in the Arithmetic module, especially [`src/pages/ArithmeticFunctionsAndHDLs/AFHDLLayout.css`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/ArithmeticFunctionsAndHDLs/AFHDLLayout.css:1).
- Topic cards are currently rendered generically from [`src/pages/Home/HomeData.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/HomeData.js:1) through [`src/pages/Home/ArticleSection.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/ArticleSection.jsx:1), which is why layout consistency and progress binding are weak.
- Tailwind CSS is not currently installed in [`package.json`](/home/atta/Documents/INTERNSHIP/web/frontend/package.json:1), so a Tailwind migration must be planned rather than assumed.

### Recommended redesign approach

Use a phased rebuild instead of trying to reskin the existing home page:

1. Extract the problem experience into its own route, layout, and data model.
2. Introduce a shared dark design system and standardize topic cards around one premium card architecture.
3. Add user progress and activity models in the backend, then hydrate the frontend from API instead of static data.
4. Move all problem/topic completion state to server-backed user progress.
5. Add profile analytics and calendar widgets after the progress pipeline is stable.

### Why this approach fits this repo

- It preserves existing educational pages and tools.
- It avoids rewriting every learning page at once.
- It lets the current auth/session layer continue working.
- It creates clear boundaries between `content`, `practice`, and `user analytics`.

## 2. Database schema changes

The frontend README states the backend runs in a sibling repo:

- [`README.md`](/home/atta/Documents/INTERNSHIP/web/frontend/README.md:1)

Because the backend code is not present here, the schema below is the target architecture. It assumes the current stack is Node/Express with MongoDB/Mongoose, which is consistent with the project ecosystem.

### Core collections

#### `users`

Keep existing auth fields and add learning metadata:

```js
{
  _id,
  name,
  email,
  passwordHash,
  role: "student" | "admin",
  avatarUrl,
  preferences: {
    theme: "dark" | "light",
    defaultProblemSort: "recommended" | "acceptance" | "difficulty" | "latest"
  },
  stats: {
    problemsSolved: Number,
    problemsAttempted: Number,
    topicsCompleted: Number,
    currentStreak: Number,
    longestStreak: Number
  },
  createdAt,
  updatedAt
}
```

#### `topics`

```js
{
  _id,
  slug: "boolean-algebra",
  title: "Boolean Algebra",
  icon,
  description,
  order: Number,
  category: "core-logic" | "advanced" | "resource",
  difficultyBand: "foundation" | "intermediate" | "advanced",
  estimatedMinutes: Number,
  problemCount: Number,
  subtopicCount: Number,
  status: "published" | "draft",
  createdAt,
  updatedAt
}
```

#### `subtopics`

```js
{
  _id,
  topicId,
  slug: "boolean-identities",
  title: "Boolean Identities",
  description,
  route: "/boolean-identities",
  order: Number,
  estimatedMinutes: Number,
  practiceProblemIds: [ObjectId],
  createdAt,
  updatedAt
}
```

#### `problems`

```js
{
  _id,
  numericId: 1001,
  slug: "half-adder",
  title: "Half Adder",
  summary,
  description,
  sourceType: "logic" | "sql" | "javascript" | "shell",
  category: "digital-logic",
  topicIds: [ObjectId],
  subtopicIds: [ObjectId],
  tags: ["Combinational", "Arithmetic"],
  difficulty: "Easy" | "Medium" | "Hard",
  premium: Boolean,
  acceptanceRate: Number,
  orderWeight: Number,
  starterConfig: {
    inputs: [String],
    outputs: [String],
    truthTable: Array,
    equations: [String],
    hints: [String]
  },
  stats: {
    totalAttempts: Number,
    totalSolved: Number
  },
  status: "published" | "draft",
  createdAt,
  updatedAt
}
```

#### `user_problem_progress`

One document per `user + problem`.

```js
{
  _id,
  userId,
  problemId,
  status: "not_started" | "attempted" | "solved",
  attempts: Number,
  lastSubmittedAt,
  firstSolvedAt,
  solvedAt,
  bookmarked: Boolean,
  listIds: [ObjectId],
  notes: String,
  timeSpentSeconds: Number,
  lastAnswerSnapshot: Object,
  createdAt,
  updatedAt
}
```

Indexes:

- unique `{ userId: 1, problemId: 1 }`
- compound `{ userId: 1, status: 1, updatedAt: -1 }`
- compound `{ userId: 1, solvedAt: -1 }`

#### `user_topic_progress`

One document per `user + topic`.

```js
{
  _id,
  userId,
  topicId,
  openedAt,
  completedAt,
  completionPercentage: Number,
  completedSubtopicIds: [ObjectId],
  lastVisitedSubtopicId,
  solvedProblemIds: [ObjectId],
  status: "not_started" | "in_progress" | "completed",
  createdAt,
  updatedAt
}
```

Indexes:

- unique `{ userId: 1, topicId: 1 }`

#### `activity_events`

This is better than storing only a calendar row per day because it preserves auditability.

```js
{
  _id,
  userId,
  type: "problem_attempted" | "problem_solved" | "topic_opened" | "topic_completed",
  problemId,
  topicId,
  subtopicId,
  occurredAt,
  meta: {
    difficulty,
    sourcePage,
    streakImpact: Number
  }
}
```

Indexes:

- `{ userId: 1, occurredAt: -1 }`
- `{ userId: 1, type: 1, occurredAt: -1 }`

#### `daily_activity_rollups`

Use as a read-optimized calendar source.

```js
{
  _id,
  userId,
  date: "2026-05-12",
  attempts: Number,
  solved: Number,
  topicsCompleted: Number,
  totalActivityScore: Number,
  streakCountAtEndOfDay: Number,
  createdAt,
  updatedAt
}
```

Indexes:

- unique `{ userId: 1, date: 1 }`

#### `streaks`

Optional if you prefer storing streak counts on `users.stats`, but useful for history.

```js
{
  _id,
  userId,
  currentStreak: Number,
  longestStreak: Number,
  lastActiveDate: "2026-05-12",
  streakStartedAt,
  updatedAt
}
```

#### `lists` and `favorites`

Required for `My Lists` and `Favorites` in the left sidebar.

```js
{
  _id,
  userId,
  name,
  description,
  problemIds: [ObjectId],
  isDefault: Boolean,
  createdAt,
  updatedAt
}
```

## 3. UI/UX architecture plan

### Design language

Adopt a single dark product language across Home, Problems, Topic pages, and Profile:

- Base palette: charcoal, graphite, muted slate, off-white
- Accent colors:
  - green for solved/success
  - amber for medium and in-progress
  - red for hard or warnings
  - blue/cyan for navigation and selected UI
- Soft 1px borders
- Layered dark surfaces
- Subtle backdrop blur only in navbar, panels, and overlays
- Minimal gradients, mostly for hero cards and featured banners

### Typography

Use a more intentional font stack than the current default:

- Headings: `Plus Jakarta Sans` or `Manrope`
- UI/body: `Inter` or `Geist`
- Monospace/problem metadata: `JetBrains Mono`

### Existing visual base to preserve

The best current design references are:

- [`src/pages/ArithmeticFunctionsAndHDLs/AFHDLLayout.css`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/ArithmeticFunctionsAndHDLs/AFHDLLayout.css:1)
- [`src/pages/Home/Home.css`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/Home.css:1)

Use these as the starting point for:

- surface elevation
- border softness
- sticky topbar behavior
- restrained motion

### Tailwind strategy

Because Tailwind is not currently installed, use an incremental adoption plan:

1. Install `tailwindcss`, `postcss`, and `autoprefixer`
2. Define tokens in `tailwind.config.js`
3. Keep CSS variables for theme switching
4. Migrate new platform surfaces first:
   - global shell
   - problems page
   - profile dashboard
   - shared topic cards
5. Leave legacy pages in CSS until migrated

This avoids breaking current modules while still meeting the React + Tailwind goal.

## 4. Component hierarchy

### Global shell

```text
AppShell
  TopNavbar
  MobileDrawer
  GlobalSearchCommand
  PageContainer
```

### Problems route

```text
ProblemsPage
  ProblemsLayout
    ProblemsSidebar
      SidebarPrimaryNav
      SidebarCollections
    ProblemsContent
      ProblemsHeroCarousel
      ProblemsFilterBar
      ProblemsToolbar
        ProblemsSearch
        DifficultySelect
        TopicSelect
        StatusSelect
        SortSelect
      ProblemsTable
        ProblemTableHeader
        ProblemRow[]
    ProblemsRightRail
      ActivityCalendarCard
      StreakCard
      TopicProgressCard
      RecentActivityCard
```

### Core topics route/home section

```text
TopicsSection
  TopicCardGrid
    TopicProgressCard[]
      TopicCardHeader
      TopicCardDescription
      TopicSubtopicList
      TopicMetaFooter
```

### Profile route

```text
ProfileDashboard
  ProfileHero
  StatsOverview
  ActivityCalendar
  SolvedByDifficulty
  TopicCompletionBreakdown
  SavedListsPanel
  RecentSolvedPanel
```

## 5. Responsive layout strategy

### Mobile

- Top navbar stays sticky.
- Left sidebar becomes a slide-over drawer.
- Right rail widgets stack below the problem list.
- Hero/banner cards become horizontal snap-scroll cards.
- Filters collapse into scrollable chips plus modal/filter sheet.
- Problem table becomes card rows with:
  - title
  - difficulty
  - acceptance
  - solved badge
  - tags

### Tablet

- Sidebar can collapse to icon-only rail.
- Right rail becomes one-column widgets below the main grid or a narrower side column.
- Topic cards render 2-up.

### Desktop

- Three-column problems layout:
  - left nav: `240-272px`
  - center: flexible content
  - right rail: `300-340px`
- Topic cards render 3 or 4 per row depending on width.

### Large screens

- Use `max-width: 1440px` for the problems experience
- Use `max-width: 1320px` for learn/topic layouts
- Prevent tables and hero cards from stretching edge-to-edge

## 6. Problem system architecture

### Route structure

Recommended new routes:

```text
/problems
/problems/:problemSlug
/study-plan
/lists
/favorites
/profile
```

### UX behavior

`/problems` should be an index page with:

- banner carousel
- topic chips
- filters
- search
- sortable table
- right rail widgets

`/problems/:problemSlug` should be the actual problem workspace with:

- statement
- tags
- difficulty
- attempts/solved state
- related topic links
- submission panel or circuit launcher
- discussion/hints later if needed

### Frontend state model

Use server-backed React state with a simple domain split:

- `auth`
- `problems`
- `topicProgress`
- `calendar`
- `profileStats`

If you do not want a heavy state library, this can still be clean with:

- route loaders or page-level fetches
- small hooks like `useProblemsQuery`, `useTopicProgress`, `useActivityCalendar`
- optimistic UI only for bookmark and completion toggles

### Problem list query contract

`GET /api/problems`

Query params:

```text
search=
difficulty=
topic=
status=all|solved|attempted|unsolved
sourceType=
sort=recommended|acceptance|difficulty|title|newest
page=
limit=
```

Response shape:

```js
{
  items: [
    {
      id,
      numericId,
      slug,
      title,
      acceptanceRate,
      difficulty,
      premium,
      tags,
      solvedStatus,
      attempted,
      topicTitles
    }
  ],
  meta: {
    page,
    limit,
    total,
    totalSolved,
    totalAttempted
  }
}
```

## 7. Topic progress tracking flow

### Trigger events

Track all of these:

1. Topic opened
2. Subtopic opened
3. Topic explicitly marked complete
4. Problem attempted
5. Problem solved
6. Subtopic completed

### Backend flow

1. User opens a topic page.
2. Frontend calls `POST /api/topic-progress/:topicId/open`.
3. Backend upserts `user_topic_progress`.
4. Backend emits an `activity_event`.
5. If the topic/subtopic reaches completion conditions, backend updates:
   - `completionPercentage`
   - `status`
   - `completedAt`
6. Backend recalculates user summary stats asynchronously or inline.

### Completion rules

Use explicit rules so progress feels consistent:

- Topic opened: does not count as completed
- Topic in progress: at least one subtopic opened or one related problem attempted
- Topic completed:
  - all subtopics visited and
  - required problems solved or
  - user manually marks complete if the module is reading-only

### Frontend display rules

Each topic card should show:

- icon
- title
- short description
- progress bar
- completion percentage
- `x/y subtopics completed`
- green check if fully completed

## 8. Calendar integration flow

### Activity source of truth

Use `activity_events` as the write model and `daily_activity_rollups` as the read model.

### Update flow

1. User solves or attempts a problem.
2. Backend writes `activity_event`.
3. Backend increments or upserts `daily_activity_rollups`.
4. Backend recalculates streak.
5. Frontend invalidates:
   - calendar query
   - summary stats query
   - topic progress query if applicable

### Calendar API

`GET /api/activity/calendar?month=2026-05`

Response:

```js
{
  month: "2026-05",
  days: [
    {
      date: "2026-05-12",
      solved: 3,
      attempts: 5,
      topicsCompleted: 1,
      intensity: 3
    }
  ],
  streak: {
    current: 7,
    longest: 19
  }
}
```

### Color scale

- `0`: neutral gray
- `1`: muted green
- `2`: medium green
- `3+`: bright green
- optional attempt-only days: amber tint

### Widget behavior

- month navigation
- hover tooltip
- daily summary click
- current streak summary
- longest streak summary

## 9. Updated frontend/backend structure

### Frontend target structure

```text
src/
  app/
    router.jsx
    providers.jsx
  components/
    layout/
      AppShell.jsx
      TopNavbar.jsx
      MobileSidebar.jsx
    ui/
      Badge.jsx
      Button.jsx
      Card.jsx
      EmptyState.jsx
      ProgressBar.jsx
      Select.jsx
      Input.jsx
    problems/
      ProblemsSidebar.jsx
      ProblemsHeroCarousel.jsx
      ProblemsFilterBar.jsx
      ProblemsToolbar.jsx
      ProblemsTable.jsx
      ProblemRow.jsx
      ProblemStatusBadge.jsx
      ActivityCalendar.jsx
      StreakWidget.jsx
      RecentActivity.jsx
    topics/
      TopicCard.jsx
      TopicCardGrid.jsx
      TopicCompletionBadge.jsx
  hooks/
    useProblemsQuery.js
    useTopicProgress.js
    useActivityCalendar.js
    useProfileStats.js
  services/
    apiClient.js
    authService.js
    problemService.js
    topicProgressService.js
    activityService.js
    profileService.js
  pages/
    Home/
    Problems/
      ProblemsPage.jsx
      ProblemDetailPage.jsx
    Profile/
      ProfileDashboard.jsx
```

### Backend target structure

Proposed for the sibling backend repo:

```text
src/
  models/
    User.js
    Topic.js
    Subtopic.js
    Problem.js
    UserProblemProgress.js
    UserTopicProgress.js
    ActivityEvent.js
    DailyActivityRollup.js
    List.js
  controllers/
    problemController.js
    topicProgressController.js
    activityController.js
    profileController.js
  routes/
    problemRoutes.js
    topicProgressRoutes.js
    activityRoutes.js
    profileRoutes.js
  services/
    progressAggregationService.js
    streakService.js
    activityRollupService.js
```

## 10. Required API changes

### Problems

- `GET /api/problems`
- `GET /api/problems/:problemSlug`
- `POST /api/problems/:problemId/attempt`
- `POST /api/problems/:problemId/solve`
- `POST /api/problems/:problemId/bookmark`
- `POST /api/problems/:problemId/unbookmark`

### Topics

- `GET /api/topics`
- `GET /api/topics/:topicSlug`
- `GET /api/topics/:topicId/progress`
- `POST /api/topics/:topicId/open`
- `POST /api/topics/:topicId/complete`
- `POST /api/subtopics/:subtopicId/open`
- `POST /api/subtopics/:subtopicId/complete`

### Activity and profile

- `GET /api/activity/calendar?month=YYYY-MM`
- `GET /api/activity/recent`
- `GET /api/profile/overview`
- `GET /api/profile/topic-breakdown`
- `GET /api/profile/problem-stats`

### Lists and favorites

- `GET /api/lists`
- `POST /api/lists`
- `PATCH /api/lists/:listId`
- `POST /api/lists/:listId/problems/:problemId`
- `DELETE /api/lists/:listId/problems/:problemId`
- `GET /api/favorites`

## 11. File-level implementation plan

### Phase 1: platform shell and routing

Frontend:

- Update [`src/App.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/App.js:1)
  - add dedicated `/problems` and `/profile` routes
  - stop treating problems as part of the home page only
- Refactor [`src/pages/Home/Navbar.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/Navbar.jsx:1)
  - extract into reusable global navbar
  - add profile dropdown, notifications slot, mobile drawer behavior
- Create `src/components/layout/AppShell.jsx`
- Create `src/components/layout/TopNavbar.jsx`

### Phase 2: dedicated problems experience

Frontend:

- Replace [`src/pages/Problems/ProblemsSection.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Problems/ProblemsSection.jsx:1)
  with:
  - `src/pages/Problems/ProblemsPage.jsx`
  - `src/components/problems/ProblemsSidebar.jsx`
  - `src/components/problems/ProblemsHeroCarousel.jsx`
  - `src/components/problems/ProblemsToolbar.jsx`
  - `src/components/problems/ProblemsTable.jsx`
  - `src/components/problems/ProblemRow.jsx`
  - `src/components/problems/ActivityCalendar.jsx`
  - `src/components/problems/StreakWidget.jsx`
- Deprecate static-only usage in [`src/pages/Problems/ProblemsData.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Problems/ProblemsData.js:1)
  and replace with API-backed fetches
- Replace [`src/pages/Problems/Problems.css`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Problems/Problems.css:1)
  with Tailwind utilities plus a small token layer

Backend:

- Add problem list/detail endpoints
- Add user problem progress model and solve/attempt endpoints

### Phase 3: topic card system normalization

Frontend:

- Replace generic topic rendering from [`src/pages/Home/ArticleSection.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/ArticleSection.jsx:1)
  for `Core Logic Topics`
- Keep the data source idea from [`src/pages/Home/HomeData.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Home/HomeData.js:1)
  but move topic metadata into backend or a typed config layer
- Create:
  - `src/components/topics/TopicCard.jsx`
  - `src/components/topics/TopicCardGrid.jsx`
  - `src/components/topics/TopicProgressPill.jsx`
- Use the visual language of the Arithmetic module as the reference card system

Backend:

- Add `topics`, `subtopics`, and `user_topic_progress`

### Phase 4: calendar and profile analytics

Frontend:

- Expand [`src/pages/Auth/ProfilePage.jsx`](/home/atta/Documents/INTERNSHIP/web/frontend/src/pages/Auth/ProfilePage.jsx:1)
  into a real learner dashboard
- Create:
  - `src/pages/Profile/ProfileDashboard.jsx`
  - `src/components/problems/ActivityCalendar.jsx`
  - `src/components/profile/StatsOverview.jsx`
  - `src/components/profile/RecentActivityList.jsx`

Backend:

- Add activity event writer
- Add rollup and streak services
- Add profile overview endpoints

### Phase 5: service layer expansion

Frontend:

- Expand [`src/services/progressService.js`](/home/atta/Documents/INTERNSHIP/web/frontend/src/services/progressService.js:1)
  into:
  - `problemService.js`
  - `topicProgressService.js`
  - `activityService.js`
  - `profileService.js`

Example service split:

```js
problemService.getProblems(filters)
problemService.getProblem(slug)
problemService.markAttempt(problemId)
problemService.markSolved(problemId)
topicProgressService.getTopicProgress(topicId)
topicProgressService.openTopic(topicId)
topicProgressService.completeTopic(topicId)
activityService.getCalendar(month)
profileService.getOverview()
```

## 12. Verification/testing checklist

### Frontend UX

- Problems page renders correctly on `320px`, `768px`, `1024px`, and `1440px`
- Left sidebar collapses cleanly on mobile/tablet
- Right rail stacks correctly below content on small screens
- No horizontal overflow in problem table, topic cards, or calendar
- Navbar remains sticky and usable across all pages
- Dark UI contrast passes accessibility checks

### Data and progress

- Logged-out users can browse but do not write progress
- Logged-in users persist solved/attempted/completed state after refresh
- Solving a problem updates:
  - problem row state
  - solved counts
  - topic progress
  - daily calendar
  - current streak
- Completing a topic updates topic card state everywhere it appears

### API contracts

- Problem list filters combine correctly
- Search, difficulty, status, topic, and sort work together
- Pagination returns correct totals
- Calendar month navigation returns correct user-specific rollups
- Duplicate solve events do not inflate streaks or solved counters

### Database correctness

- `user + problem` uniqueness is enforced
- `user + topic` uniqueness is enforced
- Activity rollup updates are idempotent
- Deleting a problem or topic is guarded or cascade-safe

### Performance

- Problems index loads under target budget with pagination
- Calendar queries use rollups, not raw event scans
- Profile overview is aggregated efficiently

## Recommended delivery sequence

1. Global shell + `/problems` route
2. API-backed problem list + progress model
3. Topic card normalization + topic progress model
4. Calendar rollups + streak engine
5. Profile dashboard
6. Saved lists/favorites/quest-style enhancements

## Important implementation notes

- The current frontend is not yet Tailwind-based, so treat Tailwind adoption as a controlled migration, not a same-day rewrite.
- The backend repo is not available in this workspace, so all schema, controller, and route changes above should be implemented in the sibling backend project referenced by the frontend README.
- The existing Arithmetic module is the strongest design baseline in this codebase; use it as the visual reference for all premium topic-card work rather than starting from the current `Problems.css` card system.
