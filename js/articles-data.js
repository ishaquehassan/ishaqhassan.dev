/* articles-data.js
   Single source of truth for the unified Articles window.
   Read by: articles-render.js (window list + detail), Spotlight, appMenus,
   gen-window-pages.py (mirrors this list to emit static SEO pages).
   Update slugs / URLs here only.
*/
(function(){
  var SITE = 'https://ishaqhassan.dev';

  var P = {
    site:   function(href, label){ return { id:'site',   url:href,            label:label||'On Site',  brand:'#7dd3fc' }; },
    medium: function(href){        return { id:'medium', url:href,            label:'Medium',          brand:'#1a8917' }; },
    devto:  function(href){        return { id:'devto',  url:href,            label:'Dev.to',          brand:'#0a0a0a' }; }
  };

  window.ARTICLES = [
    {
      slug: 'flutter-prs-merged',
      title: 'How I Got 6 PRs Merged Into Flutter Framework',
      excerpt: 'A Karachi engineer’s 90-day path into the Flutter framework: triage, the test-first bar, review etiquette, and how to repeat it.',
      metaDescription: 'How a Pakistani engineer got 6 PRs merged into the Flutter framework. Practical guide for first-time framework contributors from Asia.',
      cover: '/assets/articles/cover-flutter-prs.svg',
      coverAlt: 'Flutter framework PR contributions hero',
      topics: ['flutter','open-source','tutorial'],
      tags: ['Flutter','Open Source','Pakistan'],
      date: '2026-04-24',
      dateModified: '2026-04-25',
      readMins: 10,
      featured: true,
      icon: '🔀',
      canonicalUrl: SITE + '/blog/how-i-got-6-prs-merged-into-flutter.html',
      primaryReadUrl: '/blog/how-i-got-6-prs-merged-into-flutter.html?stay=1',
      keyTakeaways: [
        'Start with `good first issue` triage, not feature PRs. Earn the review etiquette first.',
        'Every PR needs a test. Fix-only diffs are rejected almost on sight.',
        'Tight, obvious diffs win. Reviewers reward clarity over cleverness.',
        'Plan three months, not three days. Sustainability beats burst contributions.'
      ],
      faq: [
        { q: 'How long does Flutter PR merging take?', a: 'Median 2-4 weeks once review starts. First response usually lands in 3-7 days. Plan for at least one round of revisions even on small fixes.' },
        { q: 'Do I need to be a Google employee?', a: 'No. External contributors get the same review path. Six of my PRs were merged from outside Google.' },
        { q: 'What is the hardest part?', a: 'Writing the test that proves the fix without breaking adjacent paths. The Flutter team will not take a fix without a test that fails before and passes after.' },
        { q: 'Where do I find good-first-issues?', a: 'github.com/flutter/flutter/labels/good%20first%20issue is the live list. Many are stale; pick ones with recent triage labels.' }
      ],
      platforms: [
        P.site(SITE + '/blog/how-i-got-6-prs-merged-into-flutter.html?stay=1', 'On Site'),
        P.medium('https://medium.com/@ishaqhassan/how-i-got-my-pull-requests-merged-into-flutters-official-repository-98d055f3270e'),
        P.devto('https://dev.to/ishaquehassan/how-a-pakistani-engineer-got-6-pull-requests-merged-into-flutters-official-framework-51po')
      ]
    },
    {
      slug: 'flutter-three-tree-architecture',
      title: 'Flutter’s Three-Tree Architecture Explained',
      excerpt: 'Widget tree configures, Element tree mounts, RenderObject tree paints. The bugs that hide between the layers and how to debug them.',
      metaDescription: 'Deep dive into Flutter’s Widget, Element, and RenderObject trees. How they interact and why bugs hide in the gaps.',
      cover: '/assets/articles/cover-three-tree.svg',
      coverAlt: 'Flutter three-tree architecture diagram',
      topics: ['flutter','architecture','tutorial'],
      tags: ['Flutter','Framework Internals','Rendering'],
      date: '2026-04-25',
      dateModified: '2026-04-25',
      readMins: 12,
      featured: false,
      icon: '🌳',
      canonicalUrl: SITE + '/blog/flutter-three-tree-architecture-explained.html',
      primaryReadUrl: '/blog/flutter-three-tree-architecture-explained.html?stay=1',
      keyTakeaways: [
        'Widgets are immutable configuration. Cheap to rebuild 60 times per second.',
        'Elements are persistent identity. They survive rebuilds and decide what to update.',
        'RenderObjects do the heavy lifting: layout, paint, hit-testing.',
        'Most "weird" Flutter bugs live in the gap between Widget rebuilds and Element survival.'
      ],
      faq: [
        { q: 'Why does Flutter have three trees instead of one?', a: 'Each tree solves a separate concern. Widgets are cheap immutable configuration. Elements are persistent identity. RenderObjects are heavy machinery. Splitting them lets Flutter rebuild widget configs 60x/sec without touching expensive RenderObjects.' },
        { q: 'When does a new Element get created?', a: 'When the runtimeType or the Key of a widget at a given position changes. Same type plus same key (or null key) lets Flutter reuse the existing Element and update it in place.' },
        { q: 'What is the difference between StatelessWidget and StatefulWidget at the Element level?', a: 'StatelessWidget produces a StatelessElement that just rebuilds child widgets on demand. StatefulWidget produces a StatefulElement that owns a State object that survives rebuilds and holds mutable state.' },
        { q: 'How do I debug Element-level bugs?', a: 'Use Flutter Inspector’s "Show widget inspector" with the Element tree view, or call debugDumpApp(). Most "ghost state" bugs come from Elements being reused when you expected them to be recreated, or vice versa.' }
      ],
      platforms: [
        P.site(SITE + '/blog/flutter-three-tree-architecture-explained.html?stay=1', 'On Site'),
        P.medium('https://medium.com/@ishaqhassan/how-flutters-three-tree-architecture-actually-works-953c8cc17226'),
        P.devto('https://dev.to/ishaquehassan/flutter-three-tree-architecture-explained-widgets-elements-renderobjects-2h28')
      ]
    },
    {
      slug: 'flutter-state-management-2026',
      title: 'Flutter State Management 2026: A Decision Guide',
      excerpt: 'setState, InheritedWidget, Provider, Riverpod, Bloc, signals. When to use which, with honest tradeoffs from production.',
      metaDescription: 'Decision guide to Flutter state management in 2026. setState, Provider, Riverpod, Bloc, signals: when to use which.',
      cover: '/assets/articles/cover-state-mgmt.svg',
      coverAlt: 'Flutter state management decision tree',
      topics: ['flutter','architecture','tutorial'],
      tags: ['Flutter','State Management','Architecture'],
      date: '2026-04-25',
      dateModified: '2026-04-25',
      readMins: 14,
      featured: false,
      icon: '⚛️',
      canonicalUrl: SITE + '/blog/flutter-state-management-2026-guide.html',
      primaryReadUrl: '/blog/flutter-state-management-2026-guide.html?stay=1',
      keyTakeaways: [
        'No single "best" library. Pick by app size, team familiarity, and reactivity needs.',
        'setState + a couple InheritedWidgets covers most small apps.',
        'Riverpod has the best ergonomics for medium apps in 2026.',
        'Bloc remains safest for large enterprise event-sourcing apps.',
        'Signals (signals_flutter) are the rising option for fine-grained reactivity.'
      ],
      faq: [
        { q: 'What is the best Flutter state management library in 2026?', a: 'There is no single best. For small apps, setState plus a couple of InheritedWidgets is enough. For medium apps with cross-screen state, Riverpod has the best ergonomics. For large enterprise apps with strict event-sourcing requirements, Bloc remains the safest pick. Signals are the rising option for fine-grained reactivity.' },
        { q: 'Provider or Riverpod for a new project?', a: 'Riverpod. It is the same author, evolved API, no BuildContext requirement, and better testing story. Provider is still fine if your team already knows it well, but new projects should start on Riverpod.' },
        { q: 'When does Bloc become worth its boilerplate?', a: 'When you need explicit event sourcing, time-travel debugging, or a clear audit trail of state transitions. In smaller apps, the boilerplate cost outweighs the benefit.' },
        { q: 'Are signals replacing all of these?', a: 'Not yet. Signals are excellent for fine-grained reactive UIs but the ecosystem is still maturing in 2026. Treat them as a complement to your primary state library, not a replacement.' }
      ],
      platforms: [
        P.site(SITE + '/blog/flutter-state-management-2026-guide.html?stay=1', 'On Site'),
        P.devto('https://dev.to/ishaquehassan/flutter-state-management-in-2026-a-decision-guide-for-production-apps-4b36')
      ]
    },
    {
      slug: 'flutter-plugins-case-study',
      title: 'Building Production Flutter Plugins: 156-Likes Case Study',
      excerpt: 'What it really takes to build, publish, and maintain a Flutter plugin with 156 pub.dev likes. Native bridges, federated architecture, support burden.',
      metaDescription: 'A pub.dev plugin case study with 156 likes and 470 monthly downloads. Native bridges, federated architecture, real maintenance lessons.',
      cover: '/assets/articles/cover-plugins.svg',
      coverAlt: 'Flutter plugin development case study',
      topics: ['flutter','open-source','tutorial'],
      tags: ['Flutter','Plugin Development','Open Source'],
      date: '2026-04-25',
      dateModified: '2026-04-25',
      readMins: 11,
      featured: false,
      icon: '🧩',
      canonicalUrl: SITE + '/blog/building-production-flutter-plugins-case-study.html',
      primaryReadUrl: '/blog/building-production-flutter-plugins-case-study.html?stay=1',
      keyTakeaways: [
        'Federated plugin architecture pays off the moment you add a third platform.',
        'Verified publisher status materially boosts pub.dev trust score.',
        'Support burden scales faster than downloads. Budget for issues.',
        'A clear example app is the single biggest driver of likes and adoption.'
      ],
      faq: [
        { q: 'How do I publish a Flutter plugin to pub.dev?', a: 'Run flutter create --template=plugin to scaffold platform folders. Implement Swift / Kotlin platform code, expose via MethodChannel, set up a verified publisher under your owned domain, then dart pub publish.' },
        { q: 'Federated architecture: worth the complexity?', a: 'Yes if you target three or more platforms (iOS, Android, Web, macOS, Windows, Linux). For two platforms, plain pubspec platforms section is simpler. Federated splits the public API from per-platform implementations.' },
        { q: 'How long until a plugin breaks even on maintenance?', a: 'Realistically about 6 months of active issue triage before the community starts fixing things back. Until then, expect to spend 2-4 hours a week on issues, PRs, and SDK upgrade compatibility.' },
        { q: 'What gets a Flutter plugin to 100+ likes?', a: 'A working example app, clear README with native screenshots, immediate response to first 20 issues, and a real production use-case story. Likes follow trust, not features.' }
      ],
      platforms: [
        P.site(SITE + '/blog/building-production-flutter-plugins-case-study.html?stay=1', 'On Site'),
        P.devto('https://dev.to/ishaquehassan/building-production-flutter-plugins-a-156-likes-pubdev-case-study-4e3a')
      ]
    },
    {
      slug: 'dart-isolates-guide',
      title: 'Dart Isolates: The Missing Guide',
      excerpt: 'Concurrency primitives, ports, real-world patterns. The piece every Flutter dev wishes they had read before shipping their first heavy compute feature.',
      metaDescription: 'Production guide to Dart isolates: ports, message passing, compute(), and real-world patterns for Flutter apps.',
      cover: '/assets/articles/cover-isolates.svg',
      coverAlt: 'Dart isolates concurrency diagram',
      topics: ['flutter','tutorial'],
      tags: ['Dart','Concurrency','Performance'],
      date: '2024-08-12',
      dateModified: '2024-08-12',
      readMins: 8,
      featured: false,
      icon: '🧩',
      canonicalUrl: 'https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e',
      primaryReadUrl: 'https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e',
      keyTakeaways: [
        'Isolates are not threads. They share no memory, only messages.',
        'compute() is fine for one-shot heavy work. Long-lived isolates need spawn().',
        'SendPort / ReceivePort patterns power most production isolate use.',
        'Always close ports and exit isolates explicitly to avoid leaks.'
      ],
      faq: [
        { q: 'When should I use an isolate vs async/await?', a: 'Use async / await for I/O bound work like network calls and file reads. Use an isolate when CPU-bound work would block the UI thread, typically anything over 16ms of synchronous compute on the main isolate.' },
        { q: 'What is the overhead of spawning an isolate?', a: 'Around 1-3ms on modern devices, plus the memory cost of a fresh heap. For one-shot work, compute() amortises this nicely. For repeated work, keep an isolate alive and message it.' },
        { q: 'Can isolates share memory?', a: 'Not in the general case. They communicate via copied messages. TransferableTypedData and Isolate.exit can move ownership of typed buffers without a copy, which is the main exception.' },
        { q: 'Why does my isolate code freeze the UI?', a: 'Most likely you are awaiting the isolate result on the main isolate without a yield. Wrap the call so the main isolate stays responsive while the worker runs.' }
      ],
      platforms: [
        P.medium('https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e')
      ]
    },
    {
      slug: 'flutter-native-plugins-journey',
      title: 'A Journey with Flutter Native Plugin Development',
      excerpt: 'Building cross-platform plugins for iOS and Android from scratch. Code, pitfalls, real examples from a published plugin author.',
      metaDescription: 'A field guide to building Flutter native plugins for iOS and Android. Method channels, platform views, common pitfalls.',
      cover: '/assets/articles/cover-native-plugins.svg',
      coverAlt: 'Flutter native plugin development journey',
      topics: ['flutter','tutorial','open-source'],
      tags: ['Flutter','iOS','Android'],
      date: '2021-06-04',
      dateModified: '2021-06-04',
      readMins: 7,
      featured: false,
      icon: '📱',
      canonicalUrl: 'https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061',
      primaryReadUrl: 'https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061',
      keyTakeaways: [
        'MethodChannel is enough for 80% of native plugin work.',
        'EventChannel handles streams from native to Dart.',
        'PlatformView is for actual native UI, not just data.',
        'iOS Swift bridge is finicky. Pin Xcode and Flutter versions in CI.'
      ],
      faq: [
        { q: 'MethodChannel vs PlatformView: which to use?', a: 'MethodChannel for one-off function calls and data exchange. PlatformView only when you need to embed an actual native UIView or Android View inside the Flutter widget tree.' },
        { q: 'How do I debug native plugin crashes?', a: 'On iOS, attach Xcode to the running iOS device or simulator and watch the console. On Android, run flutter logs while the app runs and look for native stack traces alongside Dart errors.' },
        { q: 'Should I write Swift or Objective-C for the iOS side?', a: 'Swift in 2024+. Objective-C is only worth it if you must support an old codebase. The Flutter plugin template defaults to Swift now.' },
        { q: 'How do I publish a native plugin?', a: 'Same flow as any pub.dev package: dart pub publish from the plugin root. Make sure your example app builds on both platforms before publishing or your pub score takes a hit.' }
      ],
      platforms: [
        P.medium('https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061')
      ]
    },
    {
      slug: 'dart-asset-indexing',
      title: 'Indexing Assets in a Dart Class (R.java pattern)',
      excerpt: 'Auto-generate typed asset references with codegen, inspired by Android’s R.java. Drop string-based asset paths forever.',
      metaDescription: 'Generate typed Flutter asset references in a Dart class. Inspired by Android R.java. End string-based asset path bugs.',
      cover: '/assets/articles/cover-assets-indexer.svg',
      coverAlt: 'Dart asset indexing pattern',
      topics: ['flutter','tutorial','open-source','tip'],
      tags: ['Dart','Codegen','Tooling'],
      date: '2020-09-22',
      dateModified: '2020-09-22',
      readMins: 6,
      featured: false,
      icon: '📁',
      canonicalUrl: 'https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb',
      primaryReadUrl: 'https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb',
      keyTakeaways: [
        'Stringly-typed asset paths are a top-3 source of "release-only" bugs.',
        'A pre-build script can scan /assets and emit a typed Dart class.',
        'IDE autocomplete for asset names is a quiet productivity multiplier.',
        'Bonus: detect dead assets at build time, remove them from final IPA / APK.'
      ],
      faq: [
        { q: 'Do I need a build_runner or just a script?', a: 'A plain Dart script that scans /assets and writes lib/generated/assets.dart is enough. build_runner is overkill unless you already use it for other codegen.' },
        { q: 'What if my designer renames an asset?', a: 'Re-run the generator. Any usage referencing the old name fails to compile, which is the entire point. You catch the rename at build time, not at runtime in production.' },
        { q: 'Can this work with --tree-shake-icons?', a: 'Yes. The generator emits string constants, not Widget instances. Tree-shaking still applies normally to anything you build with those strings.' },
        { q: 'Is there a published package?', a: 'Yes: assets_indexer on pub.dev. Or copy the generator into your own project; it is roughly 80 lines of Dart.' }
      ],
      platforms: [
        P.medium('https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb')
      ]
    },
    {
      slug: 'firebase-kotlin-functions',
      title: 'Firebase Cloud Functions Using Kotlin',
      excerpt: 'Writing Cloud Functions in Kotlin via GraalVM. Performance wins, full setup guide, and the caveats nobody warns you about.',
      metaDescription: 'Run Firebase Cloud Functions in Kotlin with GraalVM. Setup guide, performance numbers, real-world caveats.',
      cover: '/assets/articles/cover-firebase-kotlin.svg',
      coverAlt: 'Firebase Cloud Functions in Kotlin',
      topics: ['architecture','tutorial'],
      tags: ['Kotlin','Firebase','Backend'],
      date: '2022-11-15',
      dateModified: '2022-11-15',
      readMins: 5,
      featured: false,
      icon: '🔥',
      canonicalUrl: 'https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67',
      primaryReadUrl: 'https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67',
      keyTakeaways: [
        'Kotlin via GraalVM Native Image runs as fast as Node in cold starts.',
        'You lose the Node ecosystem; not every Firebase Admin call has a Kotlin equivalent.',
        'Setup is involved: GraalVM, Gradle plugin, Firebase emulator config.',
        'Pick this only if your team already lives in Kotlin and refuses to switch.'
      ],
      faq: [
        { q: 'Why use Kotlin for Cloud Functions instead of Node?', a: 'Type safety, sharing code with an Android backend, and team familiarity. The native ecosystem is much smaller, so it is a deliberate tradeoff, not a default.' },
        { q: 'What about cold-start performance?', a: 'GraalVM Native Image brings Kotlin cold-starts close to Node. Without it, JVM cold-starts make Cloud Functions painfully slow for HTTPS triggers.' },
        { q: 'Can I use Firebase Admin SDK from Kotlin?', a: 'Yes, the Java Firebase Admin SDK works fine. Just be aware not every helper from the Node SDK has a direct Kotlin / Java equivalent.' },
        { q: 'Is this production ready?', a: 'For internal services or background workers, yes. For latency-sensitive HTTPS endpoints, only if you have GraalVM tuned and accept higher operational complexity.' }
      ],
      platforms: [
        P.medium('https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67')
      ]
    },
    {
      slug: 'devncode-meetup-iv-ai',
      title: 'DevnCode Meetup IV: Artificial Intelligence',
      excerpt: 'Recap and takeaways from the DevnCode AI meetup. The state of practical AI in 2024, the talks, the people, what stuck.',
      metaDescription: 'Recap of DevnCode Meetup IV on AI. Talks, takeaways, the state of practical AI in 2024 from the Karachi developer scene.',
      cover: '/assets/articles/cover-devncode.svg',
      coverAlt: 'DevnCode Meetup IV AI recap',
      topics: ['tutorial'],
      tags: ['AI','Community','Speaking'],
      date: '2024-05-18',
      dateModified: '2024-05-18',
      readMins: 4,
      featured: false,
      icon: '🤖',
      canonicalUrl: 'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5',
      primaryReadUrl: 'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5',
      keyTakeaways: [
        'Pakistani developer community is rapidly upskilling on practical AI.',
        'Local meetups are still the highest-signal way to meet people doing real work.',
        'Speakers covered LLM ops, prompt engineering, and applied vector search.',
        'Bring your laptop. Demo culture beats slide culture.'
      ],
      faq: [
        { q: 'What was DevnCode Meetup IV about?', a: 'The fourth instalment of the DevnCode meetup focused on practical applied AI: LLM ops, prompt engineering, vector search, and shipping AI features in production apps.' },
        { q: 'Who spoke?', a: 'A mix of Karachi-based founders, senior engineers, and AI researchers. Talks covered both "ship today" and longer horizon research themes.' },
        { q: 'Will there be a Meetup V?', a: 'DevnCode runs roughly 1-2 meetups per year. Watch the DevnCode publication on Medium for announcements.' },
        { q: 'Are slides or video available?', a: 'A community recap is on Medium. Selected talks were recorded; check the DevnCode publication for the latest videos.' }
      ],
      platforms: [
        P.medium('https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5')
      ]
    }
  ];

  window.articleBySlug = function(slug){
    var arr = window.ARTICLES || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].slug === slug) return arr[i];
    return null;
  };

  window.articleStateFromUrl = function(){
    try {
      var path = (location.pathname || '').replace(/\/+$/, '');
      var m = path.match(/^\/articles\/([a-z0-9\-]+)$/i);
      if (m) return { slug: m[1] };
      var sp = new URLSearchParams(location.search);
      var a = sp.get('a');
      if (a) return { slug: a };
      return { slug: null };
    } catch (e) { return { slug: null }; }
  };

  window.relatedArticles = function(article, limit){
    if (!article) return [];
    var ts = article.topics || [];
    return (window.ARTICLES || [])
      .filter(function(o){ return o.slug !== article.slug; })
      .map(function(o){
        var score = 0;
        for (var i = 0; i < ts.length; i++) if ((o.topics||[]).indexOf(ts[i]) !== -1) score++;
        return { a: o, score: score };
      })
      .sort(function(x, y){ return y.score - x.score; })
      .slice(0, limit || 3)
      .map(function(p){ return p.a; });
  };
})();
