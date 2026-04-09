# Project Feature Vision For ESTT Community

This document defines a full product vision for a new feature named `Project`.

The idea is to turn ESTT Community into a place where students can:

- discover project ideas to build
- publish their own project ideas
- submit implementations for a project
- vote for the best implementation
- showcase completed work in a public student portfolio

This feature fits the current platform direction very well because ESTT Community already has profiles, notifications, chat, moderation, and community participation flows.

## 1. Main Goal

The `Project` feature should create a structured space for practical work, not only static content.

It should help students:

- practice by building real projects
- learn from other students' implementations
- get visibility for their work
- compare different solutions to the same problem
- collaborate and compete in a healthy way

It should also help the platform:

- increase retention and weekly activity
- create more user-generated content
- build a stronger student reputation system
- make profiles more valuable

## 2. Core Product Vision

The feature has two sides:

### A. Project Discovery

Users can browse a list of project challenges such as:

- build a student attendance tracker
- create a club event management dashboard
- build a file-sharing app for one module
- create an AI study assistant for ESTT students

Each project page explains:

- the problem to solve
- expected features
- difficulty level
- skills needed
- submission deadline if relevant
- evaluation criteria

### B. Project Showcase And Voting

When users build a solution, they can submit their implementation.

Other users can then:

- view screenshots, demo links, GitHub links, and descriptions
- vote for the best implementation
- comment or react
- compare solutions side by side

This creates a loop:

1. Someone posts a project idea.
2. Students build different implementations.
3. The community votes and gives feedback.
4. The best solutions rise to the top.
5. Student profiles become stronger through public proof of work.

## 3. Feature Objectives

### For students

- find practical ideas when they do not know what to build
- improve technical and presentation skills
- gain recognition from peers
- build a visible portfolio inside the campus platform

### For clubs and admins

- launch project competitions
- organize hackathon-style challenges
- highlight innovative work from students
- identify active and skilled contributors

### For the platform

- move from content consumption to real participation
- create a strong community around building and feedback
- make ESTT Community more unique than a normal academic website

## 4. User Roles

### 1. Regular user

Can:

- browse projects
- post project ideas
- submit implementations
- vote
- comment
- save projects

### 2. Project author

The user who created the project idea.

Can:

- edit the brief
- close submissions
- mark the project as completed
- feature selected implementations if moderation allows it

### 3. Admin / moderator

Can:

- approve or reject project posts
- approve or reject implementations
- remove spam or fake submissions
- resolve vote abuse
- feature outstanding projects on the homepage

### 4. Club organizer

Optional extension for later phases.

Can:

- publish official club challenges
- set deadlines and prizes
- choose jury-based or community voting

## 5. Main User Flows

### Flow 1: Discover a project

1. User opens `/projects`.
2. User filters by category, difficulty, status, or tech stack.
3. User opens one project detail page.
4. User reads the brief and sees current submissions.
5. User decides to build it or save it for later.

### Flow 2: Post a new project idea

1. User opens `/projects/new`.
2. User fills in title, description, category, difficulty, tags, and optional deadline.
3. User submits the project.
4. Project enters moderation .
5. Once approved, it becomes visible in the public list.

### Flow 3: Submit an implementation

1. User opens a project detail page.
2. User clicks `Submit your implementation`.
3. User adds:
   - implementation title
   - short explanation
   - screenshots
   - demo URL
   - GitHub repository URL
   - tech stack
4. User publishes the submission.
5. Submission appears in the project gallery after moderation or instant publish depending on platform rules.

### Flow 4: Vote for the best implementation

1. Users browse submitted implementations.
2. User opens one implementation card or detail page.
3. User votes once per project or once per submission depending on the chosen rule.
4. Ranking updates.
5. Top implementations are shown in a leaderboard.

### Flow 5: Publish your own project

This is an important part of your request.

The platform should support both:

- `Challenge mode`: users submit implementations to an existing project brief
- `Showcase mode`: users publish their own finished project as an original creation

This means the feature should include two content types:

1. `Project Brief`
   A challenge or idea that others can build.

2. `Project Showcase`
   A completed personal project posted by a user.

This separation keeps the product clean and avoids confusion.

## 6. Recommended Product Structure

### Option chosen for the vision

The best structure is:

- `Projects Hub`
- `Project Briefs`
- `Implementations`
- `Project Showcases`

### Why this is the best approach

If everything is mixed into one model, the experience becomes confusing.

Example:

- one user wants to propose an idea
- another user wants to submit a solution
- another user just wants to show a finished personal project

These are related, but not the same thing.

So the clean vision is:

- a student can post a challenge
- other students can compete with implementations
- any student can also publish an independent project in a showcase area

## 7. Suggested Pages And Routes

These routes match the current Next.js App Router style of the project.

- `/projects`
  Main hub with tabs: Discover, Challenges, Showcase, Top Ranked

- `/projects/new`
  Create a new project brief

- `/projects/[projectId]`
  Project brief detail page

- `/projects/[projectId]/submit`
  Submit an implementation for a project

- `/projects/[projectId]/submissions/[submissionId]`
  Submission detail page

- `/projects/showcase`
  Independent student project showcase

- `/projects/showcase/new`
  Publish your own finished project

- `/projects/showcase/[showcaseId]`
  Showcase detail page

- `/profile/[id]/projects`
  User portfolio of submitted and published projects

- `/admin/projects`
  Moderation and management dashboard

## 8. Information Architecture

### A. Project Brief fields

- `id`
- `title`
- `slug`
- `summary`
- `description`
- `category`
- `difficulty`
- `tags`
- `skills`
- `createdBy`
- `createdAt`
- `status`
- `deadline`
- `submissionCount`
- `voteMode`
- `featured`

### B. Implementation Submission fields

- `id`
- `projectId`
- `authorId`
- `title`
- `description`
- `githubUrl`
- `demoUrl`
- `screenshots`
- `videoUrl`
- `techStack`
- `createdAt`
- `status`
- `votesCount`
- `commentsCount`

### C. Project Showcase fields

- `id`
- `authorId`
- `title`
- `summary`
- `description`
- `githubUrl`
- `demoUrl`
- `screenshots`
- `videoUrl`
- `category`
- `tags`
- `createdAt`
- `status`
- `votesCount`
- `featured`

### D. Vote record fields

- `id`
- `userId`
- `targetType`
- `targetId`
- `projectId`
- `createdAt`

## 9. Voting System Vision

This part needs clear rules because it affects fairness.

## Recommended voting model

For MVP:

- one user can cast one vote per project
- the vote is given to one implementation inside that project
- users cannot vote for their own submission
- users can change their vote before the deadline

Why this is the best MVP:

- simple to understand
- fair enough for campus use
- prevents inflated voting
- easier to implement in Firebase

### Alternative voting models for later (later)

- upvote multiple submissions
- jury vote plus community vote
- weighted score based on comments, saves, and votes
- anonymous review for blind competitions

## 10. Ranking Logic

### For project briefs

Rank by:

- newest
- most active
- highest number of submissions
- featured by admin

### For implementations

Rank by:

- highest votes
- trending this week
- most discussed
- editor's pick

### For showcase projects

Rank by:

- most voted
- newest
- featured
- by category

## 11. Categories And Filters

Suggested categories:

- web development
- mobile development
- AI / machine learning
- embedded systems
- networking
- cybersecurity
- UI/UX
- data science
- automation
- club tools
- education tools

Suggested filters:

- difficulty: beginner / intermediate / advanced
- status: open / closed / completed
- type: challenge / showcase
- tech stack
- most voted
- newest
- deadline soon

## 12. Profile Integration

This feature becomes much stronger if it improves user profiles.

Add a `Projects` section in profiles with:

- project briefs created
- implementations submitted
- showcase projects published
- wins or top-ranked badges
- total votes received

Possible badges:

- `Project Creator`
- `Top Builder`
- `Community Favorite`
- `Hackathon Winner`
- `Featured Project`

This gives students visible recognition and increases motivation.

## 13. Notifications

The current product already has notifications, so this feature should reuse them.
use also email-templates to send notification emails also

Send notifications when:

- a project brief is approved
- someone submits to your project
- your implementation gets a vote milestone
- your implementation becomes top ranked
- a comment is added to your project
- a deadline is near
- your showcase project is featured

## 14. Moderation And Trust

This feature needs moderation from day one.
yes
### Moderation rules

- project briefs can be pending before publication
- links must be validated
- spam titles and empty descriptions should be blocked
- report abuse should exist on briefs and submissions
- duplicate votes should be prevented at database level
- self-voting should be blocked

### Anti-abuse ideas

- require authenticated users
- optionally require academic email verified users to vote
- throttle rapid voting activity
- log moderation actions
- allow admins to hide suspicious submissions

## 15. Community Features Around Projects

To make the feature more engaging, add:

- comments on implementations
- save project for later
- share project
- follow a project
- copy challenge to your personal todo
- ask questions under a project brief

Later extensions:

- team submissions
- mentorship requests
- recruitment from project pages
- integration with clubs and events

## 16. Business And Strategic Value

This feature is not only a technical addition. It can become one of the most differentiating parts of ESTT Community.

It can position the platform as:

- a campus portfolio hub
- a student innovation gallery
- a challenge board for clubs and departments
- a lightweight hackathon platform

This is valuable because most student platforms only offer:

- documents
- announcements
- chat

Adding projects makes ESTT Community feel more alive and more career-oriented.

## 17. Recommended MVP Scope

The best first version should stay focused.

### MVP includes

- project briefs listing page
- project brief detail page
- create project brief form
- submit implementation form
- implementation cards on project page
- voting system with one vote per project
- basic ranking
- profile project section
- admin moderation for briefs and submissions

### MVP excludes

- team submissions
- jury scoring
- prizes and payments
- advanced analytics
- blind review
- club-specific custom workflows

This keeps the first release realistic.

## 18. Suggested Database Direction

Because the current app uses Firebase Realtime Database, the first implementation can follow that existing choice.

Suggested top-level nodes:

- `projects`
- `projectSubmissions`
- `projectShowcases`
- `projectVotes`
- `projectComments`
- `projectReports`

Example shape:

```json
{
  "projects": {
    "project_123": {
      "title": "Student Attendance Tracker",
      "summary": "Build a simple app to manage attendance by class.",
      "category": "web development",
      "difficulty": "beginner",
      "createdBy": "uid_1",
      "status": "open",
      "submissionCount": 3,
      "voteMode": "single_vote_per_project",
      "createdAt": 1770000000000
    }
  },
  "projectSubmissions": {
    "submission_1": {
      "projectId": "project_123",
      "authorId": "uid_2",
      "title": "Attendance Tracker with QR scan",
      "githubUrl": "https://github.com/example/repo",
      "demoUrl": "https://demo.example.com",
      "votesCount": 12,
      "status": "approved"
    }
  }
}
```

## 19. UI Vision

The UI should feel like a mix of:

- challenge board
- gallery
- portfolio showcase

### Main hub sections

- hero block explaining the concept
- featured challenge of the week
- trending implementations
- latest showcase projects
- filters and categories

### Project detail page sections

- brief overview
- requirements
- tags and difficulty
- submission CTA
- submissions gallery
- leaderboard
- comments or Q&A

### Showcase card style

Each card should highlight:

- title
- cover image
- author
- tags
- votes
- demo / GitHub links

## 20. Launch Strategy

The safest rollout is incremental.

### Phase 1: Internal foundation

- create database structure
- build routes and forms
- add moderation tools
- add notifications

### Phase 2: Public MVP

- launch project briefs
- allow implementation submissions
- enable community voting

### Phase 3: Showcase layer

- let users publish independent projects
- improve profile portfolio
- feature top projects on homepage

### Phase 4: Competition ecosystem

- club-hosted challenges
- deadlines and prizes
- badges and reputation
- advanced ranking and analytics

## 21. Success Metrics

To know if the feature works, track:

- number of project briefs created
- number of submissions per project
- number of votes cast
- number of showcase projects published
- percentage of users who return to view projects again
- profile visits generated from project pages

## 22. Risks

### Product risks

- too few submissions if the feature is launched without seeding content
- low-quality or empty project ideas
- popularity voting instead of quality voting
- unclear difference between challenge and showcase

### Technical risks

- duplicate votes
- spam links
- too many external assets in submissions
- moderation overhead

### Mitigation

- seed the feature with 10 to 20 strong project ideas before launch
- add clear posting templates
- require minimum description quality
- keep the first voting system simple
- use moderation for early rollout

## 23. Final Recommendation

The best product direction is:

1. Build `Projects` as a new hub inside the core community product.
2. Start with `Project Briefs + Implementations + Voting`.
3. Add `Project Showcase` as the second layer.
4. Connect everything to profiles, notifications, and moderation.

This creates a feature that is useful, social, and highly visible.

It also matches the spirit of ESTT Community:

- students learn
- students build
- students share
- students get recognized

## 24. Concrete Build Plan

### Step 1: Product definition

- validate naming: `Projects`, `Challenges`, or `Build Projects`
- confirm the voting rule for MVP
- confirm if showcase launches in MVP or phase 2

### Step 2: Data model

- create Firebase nodes
- define statuses: `pending`, `approved`, `rejected`, `open`, `closed`
- define vote constraints

### Step 3: Frontend routes

- build `/projects`
- build `/projects/new`
- build `/projects/[projectId]`
- build `/projects/[projectId]/submit`
- build profile integration

### Step 4: Admin tools

- moderation list for project briefs
- moderation list for submissions
- report handling

### Step 5: Engagement layer

- notifications
- ranking
- featured items
- homepage module

### Step 6: Phase 2 improvements

- showcase mode
- comments
- team submissions
- club challenges

## 25. Recommended Naming

If you want a simple and strong name, use:

- `Projects`

If you want a more action-based name, use:

- `Challenges`

If you want both use cases together, the best navigation label is:

- `Projects`

And inside it:

- `Challenges`
- `Showcase`

That is the clearest structure for users.
