



> [!NOTE]

> Due to the large number of review comments, Critical severity comments were prioritized as inline comments.



<details>

<summary>🟠 Major comments (25)</summary><blockquote>



<details>

<summary>Copilot/.frontendskills/Achivements.md-1-1 (1)</summary><blockquote>



`1-1`: _📐 Maintainability & Code Quality_ | _🟠 Major_ | _⚡ Quick win_



**Fix filename typo: `Achivements.md` → `Achievements.md`**



The filename is misspelled (missing 'e' after 'v'). This will propagate to all references, links, and documentation indices. Rename the file now before downstream references are created.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@Copilot/.frontendskills/Achivements.md` at line 1, The file name is

misspelled and should be corrected from Achivements.md to Achievements.md.

Rename the markdown file itself, then update any references, links, or

documentation indices that point to the current name so they use the corrected

Achievements.md identifier.

```



</details>



<!-- cr-comment:v1:076a9adc121a3afe86e4a53f -->



</blockquote></details>

<details>

<summary>app/dashboard/reference-architectures/[id]/page.tsx-37-72 (1)</summary><blockquote>



`37-72`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**Render `quizError` instead of spinning forever.**



`quizError` is assigned but never used; when quiz generation fails, the panel stays on “Preparing knowledge check...” with no recovery path.













<details>

<summary>Proposed fix outline</summary>



```diff

                 <AnalysisPanel

@@

                   isQuizCompleted={isQuizCompleted}

+                  quizError={quizError}

                 />

```



```diff

   isQuizCompleted

+  quizError

 }: {

@@

   isQuizCompleted: boolean;

+  quizError: string | null;

 }) {

```



```diff

-          ) : (

+          ) : quizError ? (

+            <div className="flex flex-col items-center gap-3 text-rose-400">

+              <span className="material-symbols-outlined text-[18px]">error</span>

+              <span className="text-[10px] font-mono uppercase tracking-widest">{quizError}</span>

+              <button

+                onClick={() => setShowQuiz(false)}

+                className="px-4 py-2 rounded border border-rose-500/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-widest"

+              >

+                Back to Analysis

+              </button>

+            </div>

+          ) : (

             <div className="flex items-center gap-2 text-white/40">

```



</details>





Also applies to: 441-467



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/dashboard/reference-architectures/`[id]/page.tsx around lines 37 - 72,

The quiz generation failure state is being set in triggerQuizGeneration but

never surfaced, so the UI can stay stuck in the loading message. Update the

reference-architectures page component to render quizError in the quiz panel

instead of always showing the spinner, and use the existing state/handlers like

setQuizError, quizError, and triggerQuizGeneration to provide a visible fallback

or retry path when the fetch fails.

```



</details>



<!-- cr-comment:v1:f15bfcf31c8483bcd089b7b7 -->



_Source: Linters/SAST tools_



</blockquote></details>

<details>

<summary>app/dashboard/reference-architectures/[id]/page.tsx-42-51 (1)</summary><blockquote>



`42-51`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Only mark the quiz completed after tracking succeeds.**



`authFetch` does not throw on non-2xx responses, so a 401/500 from `/api/user/track` still shows “Verified Studied” even though completion was not recorded.













<details>

<summary>Proposed fix</summary>



```diff

   const handleQuizPass = useCallback(async () => {

-    setIsQuizCompleted(true);

     try {

-      await authFetch('/api/user/track', {

+      const response = await authFetch('/api/user/track', {

         method: 'POST',

+        headers: { 'Content-Type': 'application/json' },

         body: JSON.stringify({ event: 'reference_architecture_completed' }),

       });

+      if (!response.ok) {

+        throw new Error(`Failed to track completion (${response.status})`);

+      }

+      setIsQuizCompleted(true);

     } catch (err) {

       console.error('Failed to track completion:', err);

     }

   }, []);

```



</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/dashboard/reference-architectures/`[id]/page.tsx around lines 42 - 51, In

handleQuizPass, the completion state is being set before the tracking request

succeeds, so a non-2xx authFetch response still marks the quiz as completed.

Move the setIsQuizCompleted(true) update to after the await

authFetch('/api/user/track', ...) call in the handleQuizPass callback, and only

set it when the request returns successfully. Keep the existing error handling

in the catch block so failed tracking does not update the UI state.

```



</details>



<!-- cr-comment:v1:703a5c2761f7ff3438e04e0f -->



</blockquote></details>

<details>

<summary>components/dashboard/KnowledgeCheck.tsx-22-23 (1)</summary><blockquote>



`22-23`: _🩺 Stability & Availability_ | _🟠 Major_ | _⚡ Quick win_



**Guard empty quizzes and derive the pass threshold.**



`questions[0]` is undefined for an empty array, and a hard-coded threshold of `4` only works for exactly five questions.











<details>

<summary>Proposed fix</summary>



```diff

-  const currentQuestion = questions[currentQuestionIndex];

-  const PASS_THRESHOLD = 4; // 80% of 5

+  if (questions.length === 0) {

+    return (

+      <div className="rounded-xl border border-white/[0.05] bg-[`#0c0d16`] p-6 text-center text-white/50">

+        No knowledge-check questions are available.

+      </div>

+    );

+  }

+

+  const currentQuestion = questions[currentQuestionIndex];

+  const PASS_THRESHOLD = Math.ceil(questions.length * 0.8);

```



</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@components/dashboard/KnowledgeCheck.tsx` around lines 22 - 23, Guard the quiz

state in KnowledgeCheck by handling an empty questions array before reading

currentQuestion and by deriving the pass threshold from questions.length instead

of hard-coding 4. Update the logic around currentQuestion/currentQuestionIndex

so an empty quiz does not access questions[0], and compute the passing score

from the total number of questions to keep the component correct for any quiz

size.

```



</details>



<!-- cr-comment:v1:ad1bf2008c6cc7965998cb20 -->



</blockquote></details>

<details>

<summary>app/api/reference-architectures/quiz/route.ts-101-122 (1)</summary><blockquote>



`101-122`: _🩺 Stability & Availability_ | _🟠 Major_ | _⚡ Quick win_



**Validate the LLM quiz schema before returning it.**



The client assumes each question has `question`, `options`, and a valid `correctIndex`; returning raw model JSON can crash the quiz or create impossible scoring states.













<details>

<summary>Proposed fix</summary>



```diff

     const data = await response.json();

     const content = data.choices?.[0]?.message?.content;

@@

       parsedContent = JSON.parse(cleanContent);

     } catch (e) {

       console.error('Failed to parse AI response as JSON:', content);

       return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });

     }

+

+    const questions = parsedContent?.questions;

+    const isValidQuiz =

+      Array.isArray(questions) &&

+      questions.length === 5 &&

+      questions.every((q) =>

+        typeof q?.question === 'string' &&

+        Array.isArray(q.options) &&

+        q.options.length >= 2 &&

+        q.options.every((option: unknown) => typeof option === 'string') &&

+        Number.isInteger(q.correctIndex) &&

+        q.correctIndex >= 0 &&

+        q.correctIndex < q.options.length

+      );

+

+    if (!isValidQuiz) {

+      llmRequestsTotal.inc({ model: LLM_MODEL, status: 'error' });

+      return NextResponse.json({ error: 'AI returned invalid quiz format' }, { status: 502 });

+    }

 

     llmRequestsTotal.inc({ model: LLM_MODEL, status: 'success' });

```



</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/reference-architectures/quiz/route.ts` around lines 101 - 122, The

quiz route currently returns parsed LLM JSON from the response handling block

without checking that it matches the expected quiz shape. Add schema validation

in the route handler after JSON.parse and before NextResponse.json so each item

has question, options, and a valid correctIndex, and reject invalid payloads

with a 500 response. Use the existing route logic around content parsing,

parsedContent, and the final NextResponse.json return path to keep invalid model

output from reaching the client.

```



</details>



<!-- cr-comment:v1:4e75d40dbeeb3026334b45af -->



</blockquote></details>

<details>

<summary>components/achievements/AchievementBadgeCard.tsx-37-44 (1)</summary><blockquote>



`37-44`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**Only hide secret achievements while they are still locked.**



This branch hides every `hidden` achievement forever. Once a secret badge is unlocked, the card still renders as “Secret Achievement”, even though the page’s recent-unlocks panel already exposes the real badge metadata. Gate this placeholder on `isLocked` too.    



<details>

<summary>Suggested fix</summary>



```diff

-  if (isSecret) {

+  if (isSecret && isLocked) {

     return (

       <div className="rounded-xl border border-white/[0.04] bg-[`#0c0d16`]/30 p-4 font-mono flex flex-col items-center justify-center gap-2 h-40">

         <span className="material-symbols-outlined text-[28px] text-white/10">lock</span>

         <p className="text-[8px] text-white/20 uppercase tracking-widest">Secret Achievement</p>

       </div>

     );

   }

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@components/achievements/AchievementBadgeCard.tsx` around lines 37 - 44, The

secret-achievement placeholder in AchievementBadgeCard should only render while

the badge is still locked, not for every hidden badge. Update the isSecret

branch to also check isLocked so unlocked secret badges fall through to the

normal card rendering and show their real metadata. Use the existing isSecret

and isLocked logic in AchievementBadgeCard to keep the placeholder limited to

locked secrets only.

```



</details>



<!-- cr-comment:v1:6a086f765a17582710098dd6 -->



</blockquote></details>

<details>

<summary>app/achievements/page.tsx-27-28 (1)</summary><blockquote>



`27-28`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**Surface hook fetch failures instead of rendering an empty dashboard.**



`useAchievements()` and `useMetrics()` already expose `error`, but this page ignores them and falls back to `[]`/`null`. When either API fails, users get a legitimate-looking “0 badges unlocked” state instead of an error, which hides backend failures and misrepresents their progress.    



<details>

<summary>Suggested fix</summary>



```diff

-  const { achievements, recentlyUnlocked, isLoading: achLoading } = useAchievements();

-  const { xp, streaks, skills, isLoading: metricsLoading } = useMetrics();

+  const {

+    achievements,

+    recentlyUnlocked,

+    isLoading: achLoading,

+    error: achievementsError,

+    refresh: refreshAchievements,

+  } = useAchievements();

+  const {

+    xp,

+    streaks,

+    skills,

+    isLoading: metricsLoading,

+    error: metricsError,

+    refresh: refreshMetrics,

+  } = useMetrics();

+

+  const error = achievementsError ?? metricsError;

...

+  if (error) {

+    return (

+      <div className="flex flex-col w-full bg-[`#060810`] min-h-screen">

+        <Header />

+        <main className="flex-1 p-6 md:p-8">

+          <div className="max-w-[1400px] mx-auto rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-300">

+            Failed to load achievement data.

+            <button

+              onClick={() => {

+                refreshAchievements();

+                refreshMetrics();

+              }}

+              className="ml-3 underline"

+            >

+              Retry

+            </button>

+          </div>

+        </main>

+      </div>

+    );

+  }

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/achievements/page.tsx` around lines 27 - 28, The dashboard page is

ignoring fetch errors from useAchievements and useMetrics, which lets failures

masquerade as empty data. Update the page component to read the error values

returned by those hooks and, in the main render path of

app/achievements/page.tsx, show an explicit error state instead of defaulting to

empty achievements or null metrics when either request fails. Keep the existing

loading/data rendering logic in the same component, but gate it on the hook

error fields from useAchievements and useMetrics so backend failures are

surfaced clearly.

```



</details>



<!-- cr-comment:v1:1bc5c10c9bb039a5fead9993 -->



</blockquote></details>

<details>

<summary>app/dashboard/profile/page.tsx-13-16 (1)</summary><blockquote>



`13-16`: _📐 Maintainability & Code Quality_ | _🟠 Major_ | _⚡ Quick win_



**Replace the `any` escape hatch with the real metrics contract.**



Line 15 is already failing lint, and it is also masking a cross-file type mismatch: `/api/achievements` returns mixed metrics (`activityHeatmap`, `pinnedAchievements`, numeric counters), so this object is not a generic `Record<string, number>`. Please extract a shared `ProfileMetrics` type and use that here instead of `Record<string, any>`.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/dashboard/profile/page.tsx` around lines 13 - 16, The ProfileData metrics

field is using an unsafe generic type and should be replaced with the shared

real contract. Update the ProfileData interface in the Profile page to use a

shared ProfileMetrics type instead of Record<string, any>, and define that type

from the mixed metrics returned by /api/achievements (including activityHeatmap,

pinnedAchievements, and numeric counters). Make sure the shared type is

imported/used consistently anywhere metrics are consumed so the cross-file type

mismatch is resolved.

```



</details>



<!-- cr-comment:v1:24dd18a2f89833f776c9fee1 -->



_Source: Linters/SAST tools_



</blockquote></details>

<details>

<summary>app/dashboard/profile/page.tsx-23-23 (1)</summary><blockquote>



`23-23`: _🩺 Stability & Availability_ | _🟠 Major_ | _⚡ Quick win_



**Don't make the first fetch failure permanent.**



`hasFetched.current` is flipped before `fetchProfile()` succeeds. If the initial request fails, this page is stuck in the error state until a full remount because later renders will never retry. Reset the guard on failure, or only mark the user as fetched after a successful response.  

   





Also applies to: 51-55



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/dashboard/profile/page.tsx` at line 23, The fetch guard in

profile/page.tsx is set too early, causing a failed initial `fetchProfile()`

call to block all future retries. Update the logic around `hasFetched` and

`fetchProfile` so the ref is only marked after a successful response, or reset

it in the failure path, and make sure the retry behavior in the effect/state

handling that covers the referenced block also allows another attempt after an

error.

```



</details>



<!-- cr-comment:v1:d343d7e91b6642bd3e61fa7f -->



</blockquote></details>

<details>

<summary>components/dashboard/profile/BadgeShowcase.tsx-39-43 (1)</summary><blockquote>



`39-43`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**Show unlocked secret badges.**



The predicate on Line 43 removes every hidden achievement, but this block says only hidden **locked** achievements should be suppressed. As written, a secret badge never appears here even after unlock.  



<details>

<summary>Suggested fix</summary>



```diff

         return achievements

-            .filter((a) => !a.hidden)

+            .filter((a) => !a.hidden || a.highestTier !== null)

             .sort((a, b) => {

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@components/dashboard/profile/BadgeShowcase.tsx` around lines 39 - 43, The

filtering in BadgeShowcase’s useMemo currently removes every hidden achievement,

which also hides secret badges after they are unlocked. Update the visible list

logic so only hidden locked achievements are excluded, while hidden but unlocked

achievements still pass through. Keep the sorting behavior in this block

unchanged and adjust the predicate around achievements.filter accordingly.

```



</details>



<!-- cr-comment:v1:bd2a014e1968b49875603500 -->



</blockquote></details>

<details>

<summary>src/hooks/useAchievementNotifications.ts-21-24 (1)</summary><blockquote>



`21-24`: _🔒 Security & Privacy_ | _🟠 Major_ | _⚡ Quick win_



**Reset notification session state per authenticated user.**



Because this hook is mounted globally via `app/layout.tsx:45-48`, `queue`, `seenKeysRef`, and `sessionStartRef` survive sign-out/sign-in cycles. That can show the previous user's pending toast and suppress the next user's unlock toast when they hit the same `achievementId::tier` key.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/hooks/useAchievementNotifications.ts` around lines 21 - 24, Reset the

notification session state when the authenticated user changes in

useAchievementNotifications, since queue, seenKeysRef, and sessionStartRef

currently persist across sign-out/sign-in. Update the hook to detect changes

from useAuth().user and clear the ToastItem queue, reset the seen keys Set, and

reinitialize the session start timestamp for each new user so previous users’

toasts and deduping state do not carry over.

```



</details>



<!-- cr-comment:v1:9035c038e22e745497887816 -->



</blockquote></details>

<details>

<summary>src/hooks/useMetrics.ts-54-77 (1)</summary><blockquote>



`54-77`: _🔒 Security & Privacy_ | _🟠 Major_ | _⚡ Quick win_



**Discard stale metrics across auth changes.**



This has the same problem as `useAchievements`: `!user` exits before resetting any state, and a late response from the previous session can still repopulate XP, skills, heatmap, and pinned achievements after logout/account switching.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/hooks/useMetrics.ts` around lines 54 - 77, The useMetrics fetch callback

leaves old metrics in state when user becomes null, and a late response from a

previous session can still overwrite the current state. Update the fetch logic

in useMetrics so that the !user path clears all metric-related state (XP,

streaks, heatmap, skills, pinnedAchievements, levels) before returning, and add

a cancellation/ignore guard in fetch and useEffect so responses from prior auth

sessions are discarded after logout or account switching.

```



</details>



<!-- cr-comment:v1:a99aa4297cd8dfdf102b0493 -->



</blockquote></details>

<details>

<summary>src/hooks/useAchievements.ts-56-75 (1)</summary><blockquote>



`56-75`: _🔒 Security & Privacy_ | _🟠 Major_ | _⚡ Quick win_



**Discard stale achievement data across auth changes.**



When `user` becomes `null` this returns without clearing state, and an older in-flight request can still call `setAchievements`/`setRecentlyUnlocked` after a logout or account switch. That leaks the previous user's achievement state into the next session until another fetch wins the race.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/hooks/useAchievements.ts` around lines 56 - 75, The fetch logic in

useAchievements should clear stale achievement state when auth changes and

prevent older requests from winning after logout/account switches. Update the

fetch callback and the useEffect/user flow so that when user is null you reset

achievements, recentlyUnlocked, error, and loading state, and add request

cancellation or a guard in useCallback/useEffect to ignore late authFetch

responses before calling setAchievements or setRecentlyUnlocked.

```



</details>



<!-- cr-comment:v1:506ee2def1c0c863284f25b6 -->



</blockquote></details>

<details>

<summary>src/hooks/useTrackEvent.ts-41-46 (1)</summary><blockquote>



`41-46`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Handle HTTP failures from `/api/user/track`.**



`authFetch(...).catch(...)` only covers network exceptions. A 4xx/5xx response still resolves, so missed XP/metric writes are silently treated as success and the event is lost.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/hooks/useTrackEvent.ts` around lines 41 - 46, The tracking call in

useTrackEvent only handles rejected promises, so HTTP 4xx/5xx responses from

authFetch('/api/user/track') are treated as success. Update the useTrackEvent

flow to inspect the returned response and explicitly treat non-OK statuses as

failures, logging the event name and status/error details before considering the

track write successful.

```



</details>



<!-- cr-comment:v1:1d80434124acdcbd944628ec -->



</blockquote></details>

<details>

<summary>src/lib/achievements/engine.ts-94-97 (1)</summary><blockquote>



`94-97`: _🎯 Functional Correctness_ | _🟠 Major_ | _🏗️ Heavy lift_



**Re-run evaluation after derived metrics change.**



Achievements like `distributed_mind` and `planet_scale` are evaluated before their source metrics are recomputed, so the final unlock is missed until a later unrelated event triggers another evaluation.



   





Also applies to: 106-137



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/engine.ts` around lines 94 - 97, The achievement flow in

engine.ts updates derived metrics after unlocking, but does not re-run

evaluation, so achievements like distributed_mind and planet_scale can be missed

until a later event. In the unlock/evaluation path around the newlyUnlocked

handling, call the achievement evaluation logic again after

updateDerivedMetrics(userId) completes, and make sure the same fix is applied to

the related code path in the 106-137 range so source-metric-driven achievements

are checked against the recomputed values.

```



</details>



<!-- cr-comment:v1:e316c910b0d717a3218e32c9 -->



</blockquote></details>

<details>

<summary>src/lib/achievements/engine.ts-115-126 (1)</summary><blockquote>



`115-126`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**Count all scalability achievements for `planet_scale`.**



`planet_scale` says “Complete all scalability achievements,” but this set only checks two IDs. It ignores `auto_scaling`, `high_throughput`, and `global_infrastructure`.



   



<details>

<summary>Suggested fix</summary>



```diff

-  const scalabilityAchievements = new Set(['horizontal_hero', 'million_user_ready']);

+  const scalabilityAchievements = new Set(

+    ACHIEVEMENT_DEFINITIONS

+      .filter((d) => d.category === 'scalability')

+      .map((d) => d.id)

+  );

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/engine.ts` around lines 115 - 126, The scalability

completion check in the achievement engine is only counting a subset of

scalability badges, so `planet_scale` can be marked complete too early. Update

the `scalabilityAchievements` set and the `scalabilityCompleted` logic in

`src/lib/achievements/engine.ts` to include all scalability achievement IDs,

including `auto_scaling`, `high_throughput`, and `global_infrastructure`, so the

`scalabilityDone` result only becomes 1 when every required badge is unlocked.

```



</details>



<!-- cr-comment:v1:a3291ad3945746ca2240e4f4 -->



</blockquote></details>

<details>

<summary>app/api/achievements/route.ts-30-45 (1)</summary><blockquote>



`30-45`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Return a stable metrics DTO instead of the raw Mongo document.**



New users get a curated baseline, but existing users get the full lean document. That makes the API shape inconsistent and exposes persistence fields like `_id`, `userId`, and timestamps.



   



<details>

<summary>Suggested fix</summary>



```diff

-        const baseMetrics = metrics || {

-            totalXP: 0,

-            level: 1,

-            currentStreak: 0,

-            longestStreak: 0,

-            activityHeatmap: {},

-            pinnedAchievements: [],

-        };

+        const heatmapValue = metrics?.activityHeatmap as

+            | Map<string, number>

+            | Record<string, number>

+            | undefined;

+        const baseMetrics = {

+            totalXP: metrics?.totalXP ?? 0,

+            level: metrics?.level ?? 1,

+            currentStreak: metrics?.currentStreak ?? 0,

+            longestStreak: metrics?.longestStreak ?? 0,

+            activityHeatmap: heatmapValue instanceof Map

+                ? Object.fromEntries(heatmapValue)

+                : heatmapValue ?? {},

+            pinnedAchievements: metrics?.pinnedAchievements ?? [],

+        };

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/achievements/route.ts` around lines 30 - 45, The achievements route

currently returns a baseline object for new users but a raw lean Mongo document

for existing users, which makes the API response shape inconsistent and exposes

persistence fields. Update the response assembly in the achievements route so

both branches map through the same stable metrics DTO (for example in the route

handler before NextResponse.json), explicitly selecting only the public fields

from UserMetrics and using the same shape for the default baseline and the found

document.

```



</details>



<!-- cr-comment:v1:97c4309b41009b205d4f987b -->



</blockquote></details>

<details>

<summary>src/lib/achievements/trackMetric.ts-16-39 (1)</summary><blockquote>



`16-39`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Restrict `MetricPatch` to incrementable counters only.** `keyof IUserMetricsData` includes engine-managed fields like `totalXP`, `level`, streak state, and other derived unlock fields, so callers can `$inc` them through this API and corrupt metrics ownership. Narrow the key union to the counters that `trackMetric()` is meant to accept.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/trackMetric.ts` around lines 16 - 39, `MetricPatch` is

currently too broad because it uses `keyof IUserMetricsData`, which allows

engine-managed and derived fields to be incremented through `trackMetric()`.

Narrow the patch type in `trackMetric` to only the intended counter fields (the

incrementable metrics) so callers cannot `$inc` `totalXP`, `level`, streak

state, or unlock-derived fields; update the type alias and any related

references to use that restricted key union.

```



</details>



<!-- cr-comment:v1:764c75924bcebe6ea0301777 -->



</blockquote></details>

<details>

<summary>app/api/user/metrics/route.ts-55-55 (1)</summary><blockquote>



`55-55`: _🩺 Stability & Availability_ | _🟠 Major_ | _⚡ Quick win_



**Normalize `activityHeatmap` before serializing.** `findOne().lean()` returns a plain object here, so `Object.fromEntries(metrics.activityHeatmap ?? new Map())` can throw when `activityHeatmap` isn’t a `Map`, turning this endpoint into a 500 for users with metrics.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/user/metrics/route.ts` at line 55, Normalize metrics.activityHeatmap

in the user metrics route before calling Object.fromEntries, because the lean()

result is a plain object and not always a Map. Update the serialization logic in

the route handler that builds the response payload so it safely handles both Map

and object-shaped values (or converts the stored heatmap into a Map first) and

avoids throwing when activityHeatmap is missing or already plain data.

```



</details>



<!-- cr-comment:v1:706275ba177209fae9b5223f -->



</blockquote></details>

<details>

<summary>src/lib/achievements/trackMetric.ts-57-65 (1)</summary><blockquote>



`57-65`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Make max-metric updates atomic.** `setMetricIfHigher()` reads the current value and then writes with `$set`, so concurrent requests can still overwrite a higher value with a lower one. Use a single atomic `$max` update and only run the achievement evaluation when the stored value changes.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/trackMetric.ts` around lines 57 - 65, The

setMetricIfHigher() flow is not atomic because it reads UserMetrics and then

writes with $set, allowing concurrent requests to overwrite a higher value.

Update the logic to use a single atomic $max operation on

UserMetrics.findOneAndUpdate so only the greatest value is stored, and gate the

achievement evaluation on whether the stored metric actually changed. Keep the

fix localized to setMetricIfHigher() and its UserMetrics update path.

```



</details>



<!-- cr-comment:v1:0f91f3066e5b069e180fecd0 -->



</blockquote></details>

<details>

<summary>app/api/user/achievements/route.ts-58-80 (1)</summary><blockquote>



`58-80`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Validate pinned achievement IDs before persisting.**



The route currently accepts any array of up to 6 items, including duplicates, non-strings, unknown IDs, or achievements the user has not unlocked. Persist only unique unlocked achievement IDs.



   



<details>

<summary>Suggested fix</summary>



```diff

         const body = await request.json();

         const { pinnedAchievements } = body;

 

-        if (!Array.isArray(pinnedAchievements) || pinnedAchievements.length > 6) {

+        if (

+            !Array.isArray(pinnedAchievements) ||

+            pinnedAchievements.length > 6 ||

+            !pinnedAchievements.every((id) => typeof id === 'string') ||

+            new Set(pinnedAchievements).size !== pinnedAchievements.length

+        ) {

             return NextResponse.json(

-                { error: 'pinnedAchievements must be an array of up to 6 achievement IDs' },

+                { error: 'pinnedAchievements must be a unique array of up to 6 achievement IDs' },

                 { status: 400 }

             );

         }

@@

         if (!user) {

             return NextResponse.json({ error: 'User not found' }, { status: 404 });

         }

+

+        const unlockedIds = new Set(

+            await UserAchievement.distinct('achievementId', {

+                userId: user._id,

+                achievementId: { $in: pinnedAchievements },

+            })

+        );

+

+        if (!pinnedAchievements.every((id) => unlockedIds.has(id))) {

+            return NextResponse.json(

+                { error: 'Pinned achievements must be unlocked by the current user' },

+                { status: 400 }

+            );

+        }

 

         const UserMetrics = (await import('`@/src/lib/achievements/metrics`')).default;

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/user/achievements/route.ts` around lines 58 - 80, The

pinnedAchievements validation in the achievements route only checks array

length, so tighten it before the UserMetrics update: in the request handler,

dedupe the values, ensure every entry is a string, verify each ID exists in the

achievements catalog and belongs to the authenticated user’s unlocked

achievements, and reject invalid input with a 400 response. Keep the fix

localized to the route logic around request.json, User.findOne, and

UserMetrics.findOneAndUpdate so only unique unlocked achievement IDs are

persisted.

```



</details>



<!-- cr-comment:v1:833b297e3af80a1347a692ca -->



</blockquote></details>

<details>

<summary>app/api/user/track/route.ts-89-93 (1)</summary><blockquote>



`89-93`: _🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_



**`ai_review_completed` is a no-op for activity tracking.**



Line 91 passes `{}` into `trackMetric()`, but `src/lib/achievements/trackMetric.ts:22-35` returns immediately when the increment payload is empty. That means AI reviews currently award XP only; they do **not** update streaks, heatmap data, or achievement evaluation despite the inline comment.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/user/track/route.ts` around lines 89 - 93, The ai_review_completed

branch is not actually updating activity tracking because trackMetric() receives

an empty payload and exits early. Update the ai_review_completed case in

route.ts to pass a real metric/increment object into trackMetric() so

trackMetric() can update streaks, heatmap data, and achievement evaluation while

awardXP(userId, 'AI_REVIEW') still runs.

```



</details>



<!-- cr-comment:v1:87a4fc40e892b9f36a9c178a -->



</blockquote></details>

<details>

<summary>app/api/user/track/route.ts-59-117 (1)</summary><blockquote>



`59-117`: _🔒 Security & Privacy_ | _🟠 Major_ | _🏗️ Heavy lift_



**Don’t let the client mint authoritative XP/achievement events.**



This switch applies server-side rewards from caller-controlled `event`/`payload` values alone. Any authenticated user can replay `reference_architecture_completed`, `ai_review_completed`, or spoof values like `targetRps` to farm XP and unlock badges without completing the underlying action. Move reward writes to the server routes that already prove completion, or require a server-validated resource/state check before mutating metrics.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/user/track/route.ts` around lines 59 - 117, The reward handling in

the track route is trusting caller-controlled event and payload values, which

lets users mint XP and unlocks by replaying events like simulation_executed,

reference_architecture_completed, or ai_review_completed. Update the route’s

switch logic so trackMetric and awardXP are only called after server-side

validation from the authoritative completion flow, or move these mutations into

the server routes that already verify the action. Use the existing trackMetric,

awardXP, and setMetricIfHigher paths as the location to tighten validation

before any metrics are mutated.

```



</details>



<!-- cr-comment:v1:41d5a77aae82bd52c5a9fd7f -->



</blockquote></details>

<details>

<summary>app/api/interview/[id]/evaluate/route.ts-186-223 (1)</summary><blockquote>



`186-223`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Don’t feed absolute snapshot metrics into `trackMetric()`.**



`trackMetric()` persists this payload with `$inc`, but `consistentPerformerStreak` and `highScoreAcrossDifficulties` are computed here as current absolute values. Incrementing by those snapshots will inflate them on every evaluation, so streak/distinct-difficulty achievements can unlock much earlier than intended.



<details>

<summary>Possible fix</summary>



```diff

-                const metricPatch: Record<string, number> = {

+                const metricPatch: Record<string, number> = {

                     interviewsCompleted: 1,

                     ...(highAverageUnlocked ? { highAverageUnlocked: 1 } : {}),

                     ...(comebackUnlocked ? { comebackUnlocked: 1 } : {}),

-                    consistentPerformerStreak: streakCount,

-                    highScoreAcrossDifficulties: difficultiesWithHighScore.size,

                 };

@@

                 await Promise.all([

                     trackMetric(user._id, metricPatch),

                     awardXP(user._id, 'INTERVIEW_COMPLETED', bonusXP),

+                    setMetricIfHigher(user._id, 'consistentPerformerStreak', streakCount),

+                    setMetricIfHigher(user._id, 'highScoreAcrossDifficulties', difficultiesWithHighScore.size),

                     setMetricIfHigher(user._id, 'maxNodesInSingleDesign', nodeCount),

                 ]).catch((err) =>

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/interview/`[id]/evaluate/route.ts around lines 186 - 223, The

`metricPatch` built in `evaluate` is mixing snapshot values with increment-based

metrics, causing `trackMetric()` to overcount `consistentPerformerStreak` and

`highScoreAcrossDifficulties` because it applies `$inc`. Update the `evaluate`

flow so `trackMetric()` only receives true delta-style counters, and move the

absolute snapshot comparisons into separate logic that first checks the stored

user metrics before deciding whether to increment. Use the existing

`trackMetric`, `metricPatch`, and `setMetricIfHigher` call sites to keep streak

and distinct-difficulty achievements from inflating on repeated evaluations.

```



</details>



<!-- cr-comment:v1:4d5c37a26efb323fa8a91588 -->



</blockquote></details>

<details>

<summary>app/api/interview/[id]/evaluate/route.ts-125-225 (1)</summary><blockquote>



`125-225`: _🗄️ Data Integrity & Integration_ | _🟠 Major_ | _⚡ Quick win_



**Skip achievement/XP writes on re-evaluation.**



Earlier in this handler you also reclaim sessions whose prior status is already `evaluated`, but this block unconditionally adds `interviewsCompleted`, XP, and derived metrics again. Re-running evaluation on the same session can therefore farm progression from a single submission.



<details>

<summary>Possible fix</summary>



```diff

-            if (updated?.evaluation) {

+            if (updated?.evaluation && session.status !== 'evaluated') {

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/interview/`[id]/evaluate/route.ts around lines 125 - 225, The

achievement/XP tracking block in the evaluate handler is incrementing progress

again even when the same session is being re-evaluated. Add a guard in the

evaluation flow around the metrics/XP write path so it only runs for a

first-time completion, not when `updated.evaluation` is processed after an

already-`evaluated` session is reclaimed. Use the existing session state and the

`trackMetric`, `awardXP`, and `setMetricIfHigher` calls in this block to skip

all progression writes on re-evaluation.

```



</details>



<!-- cr-comment:v1:0f95c4d4648ecbdd75d0237b -->



</blockquote></details>



</blockquote></details>



<details>

<summary>🟡 Minor comments (8)</summary><blockquote>



<details>

<summary>Copilot/.frontendskills/Achivements.md-146-157 (1)</summary><blockquote>



`146-157`: _🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_



**Avoid naming collision: "Architect" as both level title and secret achievement**



"Architect" appears as a level title (line 265) and as a secret achievement (line 156). This will confuse users and complicate search/indexing. Rename the secret achievement to something distinct like "Secret Architect" or "Shadow Architect".













Also applies to: 241-273



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@Copilot/.frontendskills/Achivements.md` around lines 146 - 157, The secret

achievement list in Achivements.md includes “Architect”, which conflicts with

the existing level title used elsewhere in the same document. Update the entry

in the Secret Achievements section to a distinct name such as “Secret Architect”

or “Shadow Architect”, and make sure any related references in the achievements

list or indexing text use the same new identifier consistently.

```



</details>



<!-- cr-comment:v1:e728b5b462f9cc8816811146 -->



</blockquote></details>

<details>

<summary>app/api/reference-architectures/quiz/route.ts-116-118 (1)</summary><blockquote>



`116-118`: _📐 Maintainability & Code Quality_ | _🟡 Minor_ | _⚡ Quick win_



**Use or remove the unused catch binding.**



Line 116 currently triggers the lint/typecheck warning for unused `e`.













<details>

<summary>Proposed fix</summary>



```diff

-    } catch (e) {

-      console.error('Failed to parse AI response as JSON:', content);

+    } catch (parseError) {

+      console.error('Failed to parse AI response as JSON:', parseError, content);

       return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });

     }

```



</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/reference-architectures/quiz/route.ts` around lines 116 - 118, The

catch block in the quiz route has an unused binding `e`, which is triggering the

lint/typecheck warning. In the `route.ts` error handler around the JSON parse

failure, either remove the catch parameter entirely or use it in the

`console.error` message so the `catch` clause is consistent with the rest of the

handler and no unused variable remains.

```



</details>



<!-- cr-comment:v1:a98cae889c07ad6885f5a43d -->



_Source: Linters/SAST tools_



</blockquote></details>

<details>

<summary>app/api/reference-architectures/quiz/route.ts-27-31 (1)</summary><blockquote>



`27-31`: _🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_



**Return 400 for malformed or non-string request bodies.**



`req.json()` parse failures currently fall through to the outer catch and return 500. Also validate `title` and `analysis` as non-empty strings before interpolating them into the prompt.











<details>

<summary>Proposed fix</summary>



```diff

-    const { title, analysis } = await req.json();

+    let body: unknown;

+    try {

+      body = await req.json();

+    } catch {

+      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

+    }

+

+    const { title, analysis } = body as { title?: unknown; analysis?: unknown };

 

-    if (!title || !analysis) {

+    if (typeof title !== 'string' || !title.trim() || typeof analysis !== 'string' || !analysis.trim()) {

       return NextResponse.json({ error: 'Missing title or analysis data' }, { status: 400 });

     }

```



</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/reference-architectures/quiz/route.ts` around lines 27 - 31, The quiz

route currently lets malformed request bodies fail through the outer catch and

also accepts non-string values for title and analysis; update the handler in the

route’s req.json() parsing path to return a 400 when JSON parsing fails, and add

explicit validation that title and analysis are non-empty strings before

building the prompt. Keep the fix localized to the request handling logic in the

route handler so malformed or invalid input is rejected with a client error

instead of a 500.

```



</details>



<!-- cr-comment:v1:dea6af39b0068b4eb30d9c84 -->



</blockquote></details>

<details>

<summary>components/achievements/AchievementToast.tsx-117-121 (1)</summary><blockquote>



`117-121`: _🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_



**Keep `onDismiss` stable for mounted toasts.**



`AchievementToast` restarts its timer effect whenever `onDismiss` changes (Lines 31-43). This inline closure is recreated on every queue render, so adding or dismissing any toast resets the 5-second timer for all visible toasts.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@components/achievements/AchievementToast.tsx` around lines 117 - 121, The

inline onDismiss callback in the visible toast render is changing on every queue

render, which causes AchievementToast’s timer effect to restart for all mounted

toasts. Make onDismiss stable in the parent render path for AchievementToast by

memoizing the per-item dismiss handler or extracting a stable handler helper

around onDismiss(item.key), so each toast keeps the same prop identity while it

remains mounted.

```



</details>



<!-- cr-comment:v1:29967c6917334cce7e57eae6 -->



</blockquote></details>

<details>

<summary>src/hooks/useAchievements.ts-86-92 (1)</summary><blockquote>



`86-92`: _🗄️ Data Integrity & Integration_ | _🟡 Minor_ | _⚡ Quick win_



**Surface `updatePinned` failures to callers.**



`app/api/user/achievements/route.ts:49-82` rejects invalid saves (for example more than 6 IDs), but this helper resolves regardless because it never checks `res.ok`. The caller can't roll back optimistic UI or show an error when the pin update is rejected.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/hooks/useAchievements.ts` around lines 86 - 92, `updatePinned` in

`useAchievements` currently hides failed pin saves because it ignores the fetch

response. Update this helper to check the result of `authFetch` for the

`/api/user/achievements` PATCH call and surface non-OK responses by throwing or

otherwise rejecting so callers can handle rollback/error UI. Keep the change

localized to `updatePinned` and make sure the caller can detect when the server

rejects invalid pinnedAchievements updates.

```



</details>



<!-- cr-comment:v1:d14b6bd7160a6dc466987a6b -->



</blockquote></details>

<details>

<summary>src/lib/achievements/engine.ts-15-15 (1)</summary><blockquote>



`15-15`: _📐 Maintainability & Code Quality_ | _🟡 Minor_ | _⚡ Quick win_



**Remove the unused `AchievementDef` import.**



The lint/typecheck check already flags this symbol as unused.



   



<details>

<summary>Suggested fix</summary>



```diff

-import { ACHIEVEMENT_DEFINITIONS, type AchievementDef, type AchievementTier } from './definitions';

+import { ACHIEVEMENT_DEFINITIONS, type AchievementTier } from './definitions';

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/engine.ts` at line 15, Remove the unused AchievementDef

import from the engine.ts module’s import list so the lint/typecheck check

passes. Keep ACHIEVEMENT_DEFINITIONS and AchievementTier if they are still used,

and update the import statement accordingly in the achievement engine module.

```



</details>



<!-- cr-comment:v1:9410c2d93785059a199f7963 -->



_Source: Linters/SAST tools_



</blockquote></details>

<details>

<summary>src/lib/achievements/definitions.ts-691-699 (1)</summary><blockquote>



`691-699`: _🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_



**Align the “System Whisperer” requirement with its threshold.**



Line 694 says 5 difficulties, but Line 699 unlocks at 3. Update either the description or threshold so users see the actual requirement.



   



<details>

<summary>Suggested fix if 3 difficulties is intended</summary>



```diff

-    description: 'Score 90+ on 5 different interview difficulties.',

+    description: 'Score 90+ on 3 different interview difficulties.',

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@src/lib/achievements/definitions.ts` around lines 691 - 699, The System

Whisperer achievement metadata is inconsistent: the description in

achievements/definitions.ts says “Score 90+ on 5 different interview

difficulties,” while the tier threshold on the System Whisperer entry unlocks at

3. Update the System Whisperer definition so the description and the tiers

threshold match, using the achievement object’s description and tiers fields to

keep the requirement clear and consistent.

```



</details>



<!-- cr-comment:v1:a6175e75eb81f85029d375fa -->



</blockquote></details>

<details>

<summary>app/api/interview/[id]/evaluate/route.ts-209-215 (1)</summary><blockquote>



`209-215`: _🎯 Functional Correctness_ | _🟡 Minor_ | _⚡ Quick win_



**Tighten the HA rule matcher.**



`/ha|high.avail/i` will match any occurrence of `ha`, so unrelated passed-rule text like `sharding` can set `highAvailabilityDesigns`. This should match the actual HA phrases only.



<details>

<summary>Possible fix</summary>



```diff

-                if (passedRules.some((r: string) => /ha|high.avail/i.test(r)))    metricPatch.highAvailabilityDesigns = 1;

+                if (passedRules.some((r: string) => /\b(?:ha|high[- ]?availability)\b/i.test(r))) {

+                    metricPatch.highAvailabilityDesigns = 1;

+                }

```

</details>



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@app/api/interview/`[id]/evaluate/route.ts around lines 209 - 215, The

high-availability matcher in the evaluate route is too broad because the current

/ha|high.avail/i pattern can match unrelated text like sharding. Update the rule

check in the metric patch logic to match only actual HA phrases, using a

stricter expression in the passedRules.some(...) condition for

highAvailabilityDesigns so it only fires on explicit high-availability wording.

```



</details>



<!-- cr-comment:v1:91a85ec078dd9a65b1072d49 -->



</blockquote></details>



</blockquote></details>



<details>

<summary>🧹 Nitpick comments (1)</summary><blockquote>



<details>

<summary>Copilot/.frontendskills/Achivements.md (1)</summary><blockquote>



`165-165`: _📐 Maintainability & Code Quality_ | _🔵 Trivial_ | _⚡ Quick win_



**Clarify tier progression requirement vs. implementation**



The spec states "Every badge should support progression tiers," but `first_architecture` in the implementation only has a single bronze tier. Either soften this to "Most badges" or add additional tiers to single-tier achievements like `first_architecture`.



<details>

<summary>🤖 Prompt for AI Agents</summary>



```

Verify each finding against current code. Fix only still-valid issues, skip the

rest with a brief reason, keep changes minimal, and validate.



In `@Copilot/.frontendskills/Achivements.md` at line 165, The achievements spec

and implementation are out of sync because first_architecture currently defines

only a single bronze tier while the text says every badge should support

progression tiers. Update the Achivements.md entry for first_architecture to

either add additional progression tiers consistent with the other badge

definitions or relax the requirement wording to match the intended scope, and

make sure the tier model used by the badge entries remains consistent across the

document.

```



</details>



<!-- cr-comment:v1:7329045140e2517e3dc9ade3 -->



</blockquote></details>



</blockquote></details>



---



<details>

<summary>ℹ️ Review info</summary>



<details>

<summary>⚙️ Run configuration</summary>



**Configuration used**: defaults



**Review profile**: CHILL



**Plan**: Pro



**Run ID**: `ae960ca5-e123-4a9d-9c9c-e5ba21b9df39`



</details>



<details>

<summary>📥 Commits</summary>



Reviewing files that changed from the base of the PR and between f9dbfc17a1e59315a8a129e40ad229ee9fe8b640 and aee8fac082694c5b9ae07210beb85899e56ba358.



</details>



<details>

<summary>📒 Files selected for processing (35)</summary>



* `Copilot/.frontendskills/Achivements.md`

* `app/achievements/page.tsx`

* `app/api/achievements/route.ts`

* `app/api/designs/route.ts`

* `app/api/interview/[id]/evaluate/route.ts`

* `app/api/reference-architectures/quiz/route.ts`

* `app/api/user/achievements/route.ts`

* `app/api/user/metrics/route.ts`

* `app/api/user/track/route.ts`

* `app/dashboard/profile/page.tsx`

* `app/dashboard/reference-architectures/[id]/page.tsx`

* `app/layout.tsx`

* `components/achievements/AchievementBadgeCard.tsx`

* `components/achievements/AchievementNotificationProvider.tsx`

* `components/achievements/AchievementToast.tsx`

* `components/achievements/SkillBars.tsx`

* `components/achievements/XPLevelBar.tsx`

* `components/dashboard/Header.tsx`

* `components/dashboard/KnowledgeCheck.tsx`

* `components/dashboard/Sidebar.tsx`

* `components/dashboard/profile/ActivityHeatmap.tsx`

* `components/dashboard/profile/BadgeShowcase.tsx`

* `components/dashboard/profile/LevelBanner.tsx`

* `components/dashboard/profile/SkillProgress.tsx`

* `src/hooks/useAchievementNotifications.ts`

* `src/hooks/useAchievements.ts`

* `src/hooks/useMetrics.ts`

* `src/hooks/useTrackEvent.ts`

* `src/lib/achievements/definitions.ts`

* `src/lib/achievements/engine.ts`

* `src/lib/achievements/levels.ts`

* `src/lib/achievements/metrics.ts`

* `src/lib/achievements/trackMetric.ts`

* `src/lib/achievements/userAchievement.ts`

* `src/lib/achievements/xp.ts`



</details>



</details>



<!-- This is an auto-generated comment by CodeRabbit for review status -->