# How a Pakistani Engineer Got 6 Pull Requests Merged Into Flutter's Official Framework

*My journey as a Flutter Framework Contributor from Karachi, Pakistan, and why it's a big deal for the Pakistani Flutter community.*

---

## TL;DR

I'm Ishaq Hassan, Engineering Manager at DigitalHire, Flutter course instructor on the official Flutter docs, and a **Pakistani Flutter developer with 6 Pull Requests merged into the Flutter repository**, the official framework maintained by Google. This post walks through why framework-level contributions matter, how I landed mine, and a short guide for other Pakistani (and South Asian) developers who want to do the same.

**Live portfolio:** https://ishaqhassan.dev

---

## The Gap Nobody Talks About

Pakistan has thousands of Flutter developers now. You'll find Flutter jobs in Karachi, Lahore, Islamabad. You'll find Flutter-based startups, Flutter courses on YouTube, Flutter meetups, Flutter Facebook groups.

But there's a difference between **using** a framework and **contributing to it**.

If you open the Flutter repository on GitHub and search the contributor graph for Pakistani engineers with multiple merged PRs, the list is short. Surprisingly short. Most Pakistani engagement with Flutter stops at the app layer, building apps, building plugins, teaching courses. Direct contributions to the framework itself remain rare.

This article exists partly to normalize it. If you're from Pakistan and you want to contribute to the Flutter framework, **you can**. Here's how I did it.

---

## My 6 Merged Pull Requests into Flutter

As of April 2026, these are the ones that made it in:

| # | Title | PR |
|---|-------|-----|
| 1 | Fix LicenseRegistry docs to reference NOTICES instead of LICENSE | [#184572](https://github.com/flutter/flutter/pull/184572) |
| 2 | Add disposal guidance to CurvedAnimation and CurveTween docs | [#184569](https://github.com/flutter/flutter/pull/184569) |
| 3 | Add `clipBehavior` parameter to AnimatedCrossFade | [#184545](https://github.com/flutter/flutter/pull/184545) |
| 4 | Add `scrollPadding` property to DropdownMenu | [#183109](https://github.com/flutter/flutter/pull/183109) |
| 5 | Fix RouteAware.didPushNext documentation inaccuracy | [#183097](https://github.com/flutter/flutter/pull/183097) |
| 6 | Use double quotes in settings.gradle.kts template | [#183081](https://github.com/flutter/flutter/pull/183081) |

And 3 open:

- [#183110](https://github.com/flutter/flutter/pull/183110), Suppress browser word-selection in SelectableText on web right-click
- [#183079](https://github.com/flutter/flutter/pull/183079), Guard auto-scroll against Offset.infinite in ScrollableSelectionContainer
- [#183062](https://github.com/flutter/flutter/pull/183062), Reset AppBar _scrolledUnder flag when scroll context changes

---

## Where to Start (Practical Guide)

### 1. Pick the right kind of first PR

Don't try to rewrite the rendering pipeline on day one. The Flutter team, like any major OSS project, accepts **small, well-scoped, well-tested PRs** from new contributors first. Documentation fixes are underrated. Adding a single missing parameter to a widget is high-impact and low-risk.

My first merged PR (#183081) literally replaces single quotes with double quotes in a Gradle template. That's the bar. Small. Correct. Tested. Useful.

### 2. Read CONTRIBUTING.md like your life depends on it

The Flutter team has strict style guides, commit conventions, and test coverage requirements. If you don't follow them, your PR will sit forever or get closed.

### 3. Find real issues via search, not browsing

- Search Flutter issues for labels: `good first issue`, `help wanted`, `d: api docs`
- Grep the codebase for `TODO` comments near widgets you understand
- Use Flutter yourself, find a paper cut, reproduce it in a test, fix it

### 4. Tests are non-negotiable

Every PR into Flutter needs a test. If you're adding a parameter, add a unit test that proves it works. If you're fixing a bug, add a regression test. No test = no merge.

### 5. Be patient and responsive

The Flutter team gets *thousands* of PRs. Reviews are thorough. My average time from PR open to merge is 2,4 weeks. Sometimes longer. **Always respond to reviewer feedback within 24 hours**, that moves you up the priority queue.

---

## Why This Matters for Pakistan

Open source framework contributions are a **career accelerator** in a way most people underestimate:

1. **Global credibility.** When I say "Flutter Framework Contributor" on LinkedIn, I don't have to explain what that means. It's objectively verifiable on GitHub.

2. **Better jobs.** Senior Flutter roles at international companies care a lot about whether you can work at the framework level, not just app level.

3. **Community leadership.** It earns speaking invitations, course opportunities, mentorship requests.

4. **Pakistani representation.** Every time a Pakistani name appears on a merged Flutter PR, it chips away at the assumption that serious OSS contributions only come from North America or Europe.

---

## About the Flutter Course in Urdu

Separately from the framework work, I teach a **35-video Flutter course in Urdu** that is [officially listed on docs.flutter.dev](https://docs.flutter.dev/resources/courses). It's free. It covers Dart basics through advanced Flutter (state management, APIs, custom painters, deployment). It's on YouTube via Tech Idara.

If you're Urdu-speaking and want to learn Flutter properly, [here's the playlist](https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5).

---

## Call to Action

If you're a Pakistani developer reading this:

- Send your first Flutter framework PR this month. Start with docs. Don't overthink it.
- Ping me on [Twitter](https://x.com/ishaque_hassan) or [LinkedIn](https://linkedin.com/in/ishaquehassan) if you need a review before submitting. Happy to help.
- Share your merged PRs publicly. Representation compounds.

---

## Links

- **Portfolio:** https://ishaqhassan.dev
- **Flutter Framework Contributor from Pakistan (details):** https://ishaqhassan.dev/flutter-framework-contributor-pakistan.html
- **GitHub:** https://github.com/ishaquehassan
- **LinkedIn:** https://linkedin.com/in/ishaquehassan
- **Flutter Course in Urdu:** https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5
- **Email:** hello@ishaqhassan.dev

---

*Tags: Flutter, Dart, Open Source, Pakistan, Mobile Development, Software Engineering, Flutter Framework, OSS Contribution, Flutter Pakistan, Pakistani Developer*
