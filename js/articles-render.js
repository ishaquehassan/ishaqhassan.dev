/* articles-render.js
   Renderers for the unified Articles window (desktop + mobile).
   Pure DOM, no framework. Reads window.ARTICLES.
   Hooks: openArticle(slug), closeArticleDetail(), mobOpenArticle(slug),
   mobCloseArticleDetail(). Called from card click handlers and app.js router.
*/
(function(){

  var COVER_GRADIENTS = {
    'flutter-prs-merged':            'linear-gradient(135deg,#0ea5e9 0%,#6366f1 60%,#8b5cf6 100%)',
    'flutter-three-tree-architecture':'linear-gradient(135deg,#22c55e 0%,#0ea5e9 60%,#6366f1 100%)',
    'flutter-state-management-2026': 'linear-gradient(135deg,#a855f7 0%,#ec4899 50%,#f97316 100%)',
    'flutter-plugins-case-study':    'linear-gradient(135deg,#f97316 0%,#fbbf24 60%,#22c55e 100%)',
    'dart-isolates-guide':           'linear-gradient(135deg,#7dd3fc 0%,#a78bfa 70%,#c084fc 100%)',
    'flutter-native-plugins-journey':'linear-gradient(135deg,#0a0a0a 0%,#1f2937 50%,#06b6d4 100%)',
    'dart-asset-indexing':           'linear-gradient(135deg,#fbbf24 0%,#f97316 60%,#ef4444 100%)',
    'firebase-kotlin-functions':     'linear-gradient(135deg,#f97316 0%,#facc15 60%,#7c2d12 100%)',
    'devncode-meetup-iv-ai':         'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#0ea5e9 100%)'
  };

  var PLATFORM_SVG = {
    site:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>',
    medium:   '<svg width="12" height="12" viewBox="0 0 40 40" fill="currentColor"><circle cx="11" cy="20" r="7.5"/><ellipse cx="24" cy="20" rx="3.5" ry="7.5"/><ellipse cx="32" cy="20" rx="1.4" ry="7"/></svg>',
    devto:    '<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M120.12 208.29c-3.88-2.9-7.77-4.35-11.65-4.35H91.03v104.47h17.45c3.88 0 7.77-1.45 11.65-4.35 3.88-2.9 5.82-7.25 5.82-13.06v-69.65c-.01-5.8-1.96-10.16-5.83-13.06zM404.1 32H43.9C19.7 32 .06 51.59 0 75.8v360.4C.06 460.41 19.7 480 43.9 480h360.2c24.21 0 43.84-19.59 43.9-43.8V75.8c-.06-24.21-19.7-43.8-43.9-43.8zM154.2 291.19c0 18.81-11.61 47.31-48.36 47.25h-46.4V172.98h47.38c35.44 0 47.36 28.46 47.37 47.28l.01 70.93zm100.68-88.66H201.6v38.42h32.57v29.57H201.6v38.41h53.29v29.57h-62.18c-11.16.29-20.44-8.53-20.72-19.69V193.7c-.27-11.15 8.56-20.41 19.71-20.69h63.19l-.01 29.52zm103.64 115.29c-13.2 30.75-36.85 24.63-47.44 0l-38.53-144.8h32.57l29.71 113.72 29.57-113.72h32.58l-38.46 144.8z"/></svg>'
  };

  var PLATFORM_LOGO_LARGE = {
    site:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>',
    medium:   '<svg width="20" height="20" viewBox="0 0 40 40" fill="currentColor"><circle cx="11" cy="20" r="7.5"/><ellipse cx="24" cy="20" rx="3.5" ry="7.5"/><ellipse cx="32" cy="20" rx="1.4" ry="7"/></svg>',
    devto:    '<svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor"><path d="M120.12 208.29c-3.88-2.9-7.77-4.35-11.65-4.35H91.03v104.47h17.45c3.88 0 7.77-1.45 11.65-4.35 3.88-2.9 5.82-7.25 5.82-13.06v-69.65c-.01-5.8-1.96-10.16-5.83-13.06zM404.1 32H43.9C19.7 32 .06 51.59 0 75.8v360.4C.06 460.41 19.7 480 43.9 480h360.2c24.21 0 43.84-19.59 43.9-43.8V75.8c-.06-24.21-19.7-43.8-43.9-43.8zM154.2 291.19c0 18.81-11.61 47.31-48.36 47.25h-46.4V172.98h47.38c35.44 0 47.36 28.46 47.37 47.28l.01 70.93zm100.68-88.66H201.6v38.42h32.57v29.57H201.6v38.41h53.29v29.57h-62.18c-11.16.29-20.44-8.53-20.72-19.69V193.7c-.27-11.15 8.56-20.41 19.71-20.69h63.19l-.01 29.52zm103.64 115.29c-13.2 30.75-36.85 24.63-47.44 0l-38.53-144.8h32.57l29.71 113.72 29.57-113.72h32.58l-38.46 144.8z"/></svg>'
  };

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fmtDate(iso){
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function filterTokens(article){
    var toks = ['all'];
    (article.topics || []).forEach(function(t){ if (toks.indexOf(t) === -1) toks.push(t); });
    (article.platforms || []).forEach(function(p){ if (toks.indexOf(p.id) === -1) toks.push(p.id); });
    return toks.join(' ');
  }

  function chipsHtml(article, large){
    var pool = large ? PLATFORM_LOGO_LARGE : PLATFORM_SVG;
    // The "site" platform is the window itself — don't render a chip that just
    // links back to the same /blog/ static page. Cards open inline; detail view
    // already IS the on-site read. Only render external chips (Medium / Dev.to).
    var external = (article.platforms || []).filter(function(p){ return p.id !== 'site'; });
    if (!external.length) return '';
    return external.map(function(p){
      var cls = large ? 'platform-chip platform-chip-lg' : 'platform-chip';
      return '<a class="' + cls + '" data-p="' + esc(p.id) + '" href="' + esc(p.url) + '" '
        + 'target="_blank" rel="noopener noreferrer" '
        + 'onclick="event.stopPropagation();" aria-label="Read on ' + esc(p.label) + '">'
        + (pool[p.id] || '') + '<span>' + esc(p.label) + '</span></a>';
    }).join('');
  }

  function tagsHtml(article){
    return (article.tags || []).map(function(t){
      return '<span class="article-tag">' + esc(t) + '</span>';
    }).join('');
  }

  function coverBg(slug){
    var bannerUrl = '/assets/articles/cover-' + slug + '.svg';
    var grad = COVER_GRADIENTS[slug] || 'linear-gradient(135deg,#7dd3fc,#6366f1)';
    // Layered: SVG banner on top, gradient below as fallback if banner fails to load.
    return "url('" + bannerUrl + "') center/cover no-repeat, " + grad;
  }

  function cardHtml(article, idx){
    var featured = article.featured ? ' featured' : '';
    return '<article class="article-card' + featured + '" '
      + 'data-slug="' + esc(article.slug) + '" '
      + 'data-filter-val="' + esc(filterTokens(article)) + '" '
      + 'style="--i:' + idx + ';">'
      + '<a class="article-card-link" '
      +   'href="/articles/' + esc(article.slug) + '/" '
      +   'onclick="return openArticle(\'' + esc(article.slug) + '\', event);" '
      +   'aria-label="' + esc(article.title) + '"></a>'
      + '<div class="article-cover" style="background:' + coverBg(article.slug) + ';"></div>'
      + '<div class="article-card-body">'
      +   (article.featured ? '<div class="article-card-label">Featured</div>' : '')
      +   '<div class="article-card-title">' + esc(article.title) + '</div>'
      +   '<div class="article-card-excerpt">' + esc(article.excerpt) + '</div>'
      +   '<div class="article-card-meta">'
      +     '<span>' + fmtDate(article.date) + '</span>'
      +     '<span class="dot">·</span>'
      +     '<span>' + (article.readMins || 5) + ' min read</span>'
      +   '</div>'
      +   '<div class="article-card-tags">' + tagsHtml(article) + '</div>'
      +   (function(){
          var c = chipsHtml(article, false);
          return c ? '<div class="article-platform-chips">' + c + '</div>' : '';
        })()
      + '</div>'
      + '</article>';
  }

  function takeawaysHtml(article){
    var items = (article.keyTakeaways || []).map(function(t){
      return '<li class="article-takeaway-item">'
        + '<svg class="article-takeaway-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L10 17 L19 7"/></svg>'
        + '<span>' + esc(t) + '</span>'
        + '</li>';
    }).join('');
    if (!items) return '';
    return '<section class="article-takeaways">'
      + '<h3 class="article-section-h">Key Takeaways</h3>'
      + '<ul class="article-takeaway-list">' + items + '</ul>'
      + '</section>';
  }

  function faqHtml(article){
    var items = (article.faq || []).map(function(p){
      return '<details class="article-faq-item"><summary><span>' + esc(p.q) + '</span></summary>'
        + '<p>' + esc(p.a) + '</p></details>';
    }).join('');
    if (!items) return '';
    return '<section class="article-faq">'
      + '<h3 class="article-section-h">Frequently Asked Questions</h3>'
      + items
      + '</section>';
  }

  function relatedHtml(article){
    var rel = (window.relatedArticles ? window.relatedArticles(article, 3) : []);
    if (!rel.length) return '';
    var cards = rel.map(function(o){
      return '<a class="article-related-card" href="/articles/' + esc(o.slug) + '/" '
        + 'onclick="return openArticle(\'' + esc(o.slug) + '\', event);" '
        + 'aria-label="' + esc(o.title) + '">'
        + '<div class="article-related-cover" style="background:' + coverBg(o.slug) + ';"></div>'
        + '<div class="article-related-body">'
        +   '<div class="article-related-title">' + esc(o.title) + '</div>'
        +   '<div class="article-related-meta">' + (o.readMins || 5) + ' min · ' + fmtDate(o.date) + '</div>'
        + '</div>'
        + '</a>';
    }).join('');
    return '<section class="article-related">'
      + '<h3 class="article-section-h">Related Articles</h3>'
      + '<div class="article-related-grid">' + cards + '</div>'
      + '</section>';
  }

  function platformBlockHtml(article){
    var chips = chipsHtml(article, true);
    if (!chips) return '';
    return '<section class="article-platform-block">'
      + '<h3 class="article-section-h">Also available on</h3>'
      + '<div class="article-platform-row">' + chips + '</div>'
      + '</section>';
  }

  function isSiteArticle(article){
    var c = (article && article.canonicalUrl) || '';
    return c.indexOf('/blog/') !== -1 && c.indexOf('ishaqhassan.dev') !== -1;
  }

  function railCardHtml(o){
    return '<a class="article-rail-card" href="/articles/' + esc(o.slug) + '/" '
      + 'onclick="return openArticle(\'' + esc(o.slug) + '\', event);" '
      + 'aria-label="' + esc(o.title) + '">'
      + '<div class="article-rail-cover" style="background:' + coverBg(o.slug) + ';"></div>'
      + '<div class="article-rail-body">'
      +   '<div class="article-rail-title">' + esc(o.title) + '</div>'
      +   '<div class="article-rail-meta">' + (o.readMins || 5) + ' min · ' + fmtDate(o.date) + '</div>'
      + '</div>'
      + '</a>';
  }

  function sideRailHtml(currentArticle, side){
    var arts = (window.ARTICLES || []).filter(function(a){ return a.slug !== currentArticle.slug; });
    arts.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });
    var picks = (side === 'right') ? arts.slice(0, 4) : arts.slice(4, 8);
    if (!picks.length) return '';
    var label = (side === 'right') ? 'Recent reads' : 'More to read';
    return '<aside class="article-side-rail article-side-rail-' + side + '" aria-label="' + label + '">'
      + '<h4 class="article-rail-h">' + label + '</h4>'
      + picks.map(railCardHtml).join('')
      + '</aside>';
  }

  function detailHtml(article){
    var primaryPlatform = (article.platforms && article.platforms[0]) ? article.platforms[0] : null;
    var primaryLabel = primaryPlatform ? primaryPlatform.label : 'the article';
    var primaryExternal = primaryPlatform && primaryPlatform.id !== 'site';
    var primaryHref = primaryExternal ? (primaryPlatform ? primaryPlatform.url : '#') : '#';
    var siteOriginal = isSiteArticle(article);
    return '<div class="article-detail-grid">'
      + sideRailHtml(article, 'left')
      + '<article class="article-body">'
      +   '<div class="article-hero" style="background:' + coverBg(article.slug) + ';"></div>'
      +   '<div class="article-hero-meta">'
      +     '<div class="article-tags-row">' + tagsHtml(article) + '</div>'
      +     '<h1 class="article-h1">' + esc(article.title) + '</h1>'
      +     '<div class="article-meta-row">'
      +       '<span>' + fmtDate(article.date) + '</span>'
      +       '<span class="dot">·</span>'
      +       '<span>' + (article.readMins || 5) + ' min read</span>'
      +     '</div>'
      +     '<p class="article-excerpt-lg">' + esc(article.excerpt) + '</p>'
      +     (primaryExternal
        ? '<a class="article-cta-primary" href="' + esc(primaryHref) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">'
            + 'Read the full story on ' + esc(primaryLabel)
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18"/></svg>'
            + '</a>'
        : '')
      +   '</div>'
      +   takeawaysHtml(article)
      +   (siteOriginal
        ? '<section class="article-full-body" data-slug="' + esc(article.slug) + '" data-loaded="0">'
          + '<h3 class="article-section-h">Full article</h3>'
          + '<div class="article-full-content"><div class="article-loader" aria-hidden="true"><span></span><span></span><span></span></div><p class="article-loading-text">Loading the full read…</p></div>'
          + '</section>'
        : '')
      +   platformBlockHtml(article)
      +   faqHtml(article)
      +   relatedHtml(article)
      +   '<div class="article-footer-back">'
      +     '<button type="button" class="article-back-bottom" onclick="closeArticleDetail();return false;">'
      +       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18 L9 12 L15 6"/></svg>'
      +       '<span>Back to Articles</span>'
      +     '</button>'
      +   '</div>'
      + '</article>'
      + (siteOriginal
        ? '<aside class="article-side-rail article-side-rail-right article-toc-rail" data-toc-rail="1" aria-label="In this article">'
          + '<h4 class="article-rail-h">In this article</h4>'
          + '<div class="article-toc-loading"><div class="article-loader" aria-hidden="true"><span></span><span></span><span></span></div></div>'
          + '</aside>'
        : sideRailHtml(article, 'right'))
      + '</div>';
  }

  /* ===== INLINE ARTICLE BODY LOADER =====
     Fetches /blog/<slug>.html?stay=1, extracts <article> body, sanitises noise
     (top-page redirect script, hidden style tag, footer copyright), injects.
     Cached per-slug so reopening the detail view is instant.
     CRITICAL: canonical URLs are absolute (https://ishaqhassan.dev/blog/...).
     Strip the host so fetch hits the SAME origin (localhost or prod) and avoids
     CORS errors. */
  var _bodyCache = {};
  function relativeBlogUrl(article){
    var canon = (article && article.canonicalUrl) || '';
    var path = canon.replace(/^https?:\/\/[^\/]+/, ''); // strip scheme+host
    if (!path) return null;
    return path + (path.indexOf('?') >= 0 ? '&' : '?') + 'stay=1';
  }
  function loadArticleBody(article){
    if (!article) return Promise.resolve(null);
    if (!isSiteArticle(article)) return Promise.resolve(null);
    var slug = article.slug;
    if (_bodyCache[slug]) return Promise.resolve(_bodyCache[slug]);
    var url = relativeBlogUrl(article);
    if (!url) return Promise.resolve(null);
    return fetch(url, { credentials: 'same-origin' })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(rawHtml){
        var doc = new DOMParser().parseFromString(rawHtml, 'text/html');
        // Strip the redirect mask + redirect script (would otherwise still try to run on our doc).
        var maskStyle = doc.getElementById('ihp-redirect-mask');
        if (maskStyle && maskStyle.parentNode) maskStyle.parentNode.removeChild(maskStyle);
        // Prefer <article>, fall back to <main>, then <body>.
        var node = doc.querySelector('article') || doc.querySelector('main') || doc.body;
        if (!node) return null;
        // Drop scripts, styles, and document-level noise.
        Array.prototype.forEach.call(node.querySelectorAll('script, style, link[rel="stylesheet"], nav.crumbs, .back-to-blog, .blog-back'), function(s){
          if (s.parentNode) s.parentNode.removeChild(s);
        });
        var bodyHtml = (node.innerHTML || '').trim();
        if (!bodyHtml) return null;
        _bodyCache[slug] = bodyHtml;
        return bodyHtml;
      })
      .catch(function(err){ try { console.warn('[articles] body fetch failed', slug, err); } catch(e) {} return null; });
  }

  function injectArticleBody(rootEl, article){
    if (!rootEl) return;
    var section = rootEl.querySelector('.article-full-body[data-slug="' + article.slug + '"]');
    if (!section || section.getAttribute('data-loaded') === '1') return;
    loadArticleBody(article).then(function(html){
      if (!html) {
        section.innerHTML = '<p class="article-loading-text">The full article is hosted on '
          + ((article.platforms && article.platforms[0]) ? article.platforms[0].label : 'the platform')
          + '. <a class="article-link" href="' + esc(article.primaryReadUrl || '#') + '"'
          + ((article.platforms && article.platforms[0] && article.platforms[0].id !== 'site') ? ' target="_blank" rel="noopener noreferrer"' : '')
          + '>Open it →</a></p>';
        section.setAttribute('data-loaded', '1');
        return;
      }
      var content = section.querySelector('.article-full-content');
      if (content) content.innerHTML = html;
      // Internal vs external link routing is handled globally by app.js
      // (delegated click + auto-target). No per-article rewiring needed.
      section.setAttribute('data-loaded', '1');
      // Body is in DOM — build TOC for the right rail (desktop only).
      try { buildAndMountToc(rootEl, article); } catch(e) {}
    });
  }

  /* ===== TABLE OF CONTENTS (right rail) =====
     Scans .article-full-content for h1-h3, builds anchor list, mounts into the
     .article-toc-rail. IntersectionObserver highlights the active heading as
     user scrolls inside .fshell-content. */
  function tocSlugify(s){
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 64);
  }
  function buildAndMountToc(rootEl, article){
    var rail = rootEl.querySelector('.article-toc-rail[data-toc-rail="1"]');
    if (!rail) return;
    var content = rootEl.querySelector('.article-full-content');
    if (!content) return;
    var nodes = content.querySelectorAll('h1, h2, h3');
    var toc = [];
    var seen = {};
    Array.prototype.forEach.call(nodes, function(h){
      var text = (h.textContent || '').trim();
      if (!text) return;
      var lvl = parseInt(h.tagName.charAt(1), 10) || 2;
      // Skip h1 if it duplicates the article hero title — body usually has no h1
      // beyond the inlined title; avoids a noisy first item.
      if (lvl === 1 && toc.length === 0 && text === article.title) return;
      var base = h.id || ('art-h-' + tocSlugify(text));
      var id = base, n = 2;
      while (seen[id]) { id = base + '-' + n; n++; }
      seen[id] = true;
      h.id = id;
      h.classList.add('article-toc-target');
      toc.push({ id: id, text: text, level: lvl });
    });
    if (!toc.length) {
      rail.style.display = 'none';
      return;
    }
    var minLvl = Math.min.apply(null, toc.map(function(t){ return t.level; }));
    var itemsHtml = toc.map(function(t){
      var indent = Math.max(0, t.level - minLvl);
      return '<a class="article-toc-item" data-toc-id="' + t.id + '" data-toc-indent="' + indent + '" '
        + 'href="#' + t.id + '" '
        + 'onclick="return scrollToTocHeading(\'' + t.id + '\', event);">'
        + '<span class="article-toc-marker" aria-hidden="true"></span>'
        + '<span class="article-toc-text">' + esc(t.text) + '</span>'
        + '</a>';
    }).join('');
    rail.innerHTML = '<h4 class="article-rail-h">In this article</h4>'
      + '<nav class="article-toc-nav">' + itemsHtml + '</nav>';
    setupTocObserver(rail, toc);
  }

  /* Active-heading tracking is done with raw scrollTop comparison instead of
     IntersectionObserver. IO returns "first visible" which flips to the NEXT
     heading the moment its top crosses rootMargin upper bound — that gave the
     "click 2nd, highlight 3rd" bug. And IO has no concept of "scrolled past
     all headings" so the bottom of the article fell back to first heading.
     The pure-offset approach below picks the LAST heading whose top has been
     scrolled past, with explicit at-bottom override. */
  var _tocScrollHandler = null;
  var _tocResizeHandler = null;
  var _tocScroller = null;
  var _tocClickLockUntil = 0;
  var _tocActiveId = null;
  var TOC_OFFSET = 90;     /* px below scroller top where "current" heading sits */
  var TOC_BOTTOM_FUDGE = 6;

  function setupTocObserver(rail, toc){
    // Tear down any previous wiring (re-render keeps a single live tracker).
    if (_tocScrollHandler && _tocScroller) {
      try { _tocScroller.removeEventListener('scroll', _tocScrollHandler); } catch(e) {}
    }
    if (_tocResizeHandler) {
      try { window.removeEventListener('resize', _tocResizeHandler); } catch(e) {}
    }
    _tocScrollHandler = null; _tocResizeHandler = null; _tocScroller = null;
    _tocClickLockUntil = 0; _tocActiveId = null;

    var scroller = document.querySelector('#win-articles .fshell-content');
    if (!scroller) return;
    var elems = toc.map(function(t){ return document.getElementById(t.id); }).filter(Boolean);
    if (!elems.length) return;

    var setActive = function(activeId){
      if (activeId === _tocActiveId) return;
      _tocActiveId = activeId;
      rail.querySelectorAll('.article-toc-item').forEach(function(a){
        a.classList.toggle('is-active', a.getAttribute('data-toc-id') === activeId);
      });
    };

    var offsets = [];
    var computeOffsets = function(){
      var scrollerRectTop = scroller.getBoundingClientRect().top;
      offsets = elems.map(function(el){
        return {
          id: el.id,
          top: el.getBoundingClientRect().top - scrollerRectTop + scroller.scrollTop
        };
      });
    };
    computeOffsets();
    // Body images can shift offsets after they decode — recompute on first
    // few scroll ticks. We just always recompute on each tick (cheap enough
    // since we're using rAF throttle). That also handles font-load reflow.

    var ticking = false;
    var update = function(){
      ticking = false;
      if (Date.now() < _tocClickLockUntil) return;
      computeOffsets();
      var scrollTop = scroller.scrollTop;
      var maxScroll = scroller.scrollHeight - scroller.clientHeight;
      // At-bottom: force last heading active so the final section never
      // falls back to "first heading" just because nothing is "visible above".
      if (maxScroll > 0 && scrollTop + TOC_BOTTOM_FUDGE >= maxScroll) {
        setActive(offsets[offsets.length - 1].id);
        return;
      }
      var probe = scrollTop + TOC_OFFSET;
      var activeId = offsets[0].id;
      for (var i = 0; i < offsets.length; i++) {
        if (offsets[i].top <= probe) activeId = offsets[i].id;
        else break;
      }
      setActive(activeId);
    };

    _tocScroller = scroller;
    _tocScrollHandler = function(){
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    _tocResizeHandler = function(){ computeOffsets(); update(); };
    scroller.addEventListener('scroll', _tocScrollHandler, { passive: true });
    window.addEventListener('resize', _tocResizeHandler);
    // Initial state.
    update();
  }

  window.scrollToTocHeading = function(id, ev){
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    var target = document.getElementById(id);
    var scroller = document.querySelector('#win-articles .fshell-content');
    if (!target || !scroller) return false;
    // Pre-set active immediately and lock the tracker so the smooth scroll
    // animation can't briefly flip the highlight to the next heading.
    var rail = document.querySelector('#articles-stage .article-toc-rail');
    if (rail) {
      rail.querySelectorAll('.article-toc-item').forEach(function(a){
        a.classList.toggle('is-active', a.getAttribute('data-toc-id') === id);
      });
      _tocActiveId = id;
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    _tocClickLockUntil = Date.now() + (reduce ? 60 : 720);
    var top = target.getBoundingClientRect().top
      - scroller.getBoundingClientRect().top
      + scroller.scrollTop - (TOC_OFFSET - 4);
    try {
      scroller.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    } catch(e) {
      scroller.scrollTop = top;
    }
    return false;
  };

  /* ===== DESKTOP RENDERERS ===== */

  function setDetailModeClasses(on){
    var stage = document.getElementById('articles-stage');
    var win = document.getElementById('win-articles');
    if (stage) stage.classList[on ? 'add' : 'remove']('articles-stage-detail');
    if (win)   win.classList[on ? 'add' : 'remove']('articles-detail-mode');
  }

  /* Sexy toolbar back button — injected once into the window-toolbar's wt-right.
     CSS shows it only when .articles-detail-mode is active. The window-title
     text is also swapped to the current article title for cinematic effect. */
  function ensureToolbarBackButton(){
    var win = document.getElementById('win-articles');
    if (!win) return;
    if (win.querySelector('.wt-back-btn')) return;
    var wtRight = win.querySelector('.window-toolbar .wt-right');
    if (!wtRight) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wt-back-btn';
    btn.setAttribute('aria-label', 'Back to Articles');
    btn.onclick = function(ev){
      if (ev) { ev.stopPropagation(); ev.preventDefault(); }
      if (typeof window.closeArticleDetail === 'function') window.closeArticleDetail();
      return false;
    };
    // mousedown stop so it doesn't trigger window drag.
    btn.addEventListener('mousedown', function(ev){ ev.stopPropagation(); });
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18 L9 12 L15 6"/></svg>'
      + '<span>Articles</span>';
    wtRight.insertBefore(btn, wtRight.firstChild);
  }

  function setToolbarTitle(text){
    var win = document.getElementById('win-articles');
    if (!win) return;
    var label = text || 'Articles';
    // After fshell reshape the title lives in .wt-title; before reshape it's
    // .window-title. Update both so the value sticks regardless of timing.
    var t1 = win.querySelector('.wt-title');
    var t2 = win.querySelector('.window-title');
    if (t1) { t1.textContent = label; t1.title = label; }
    if (t2) { t2.textContent = label; t2.title = label; }
  }

  function renderArticleList(){
    var grid = document.querySelector('#articles-stage .articles-grid');
    if (!grid) return;
    var html = (window.ARTICLES || []).map(function(a, i){ return cardHtml(a, i); }).join('');
    grid.innerHTML = html;
    setDetailModeClasses(false);
    setToolbarTitle('Articles');
    if (typeof window.fshellTagFilterCards === 'function') {
      try { window.fshellTagFilterCards(); } catch(e) {}
    }
  }

  function renderArticleDetail(slug){
    var article = window.articleBySlug(slug);
    if (!article) { renderArticleList(); return; }
    var det = document.querySelector('#articles-stage .articles-detail-view');
    if (!det) return;
    det.innerHTML = detailHtml(article);
    ensureToolbarBackButton();
    setDetailModeClasses(true);
    setToolbarTitle(article.title);
    var content = document.querySelector('#win-articles .fshell-content');
    if (content) content.scrollTop = 0;
    // Lazy-load full body for site-original articles
    injectArticleBody(det, article);
  }

  /* ===== MOBILE RENDERERS ===== */

  function mobCardHtml(article, idx){
    return '<article class="mob-art-card' + (article.featured ? ' featured' : '') + '" '
      + 'data-slug="' + esc(article.slug) + '" '
      + 'style="--i:' + idx + ';">'
      + '<a class="mob-art-card-link" '
      +   'href="/articles/' + esc(article.slug) + '/" '
      +   'onclick="return mobOpenArticle(\'' + esc(article.slug) + '\', event);" '
      +   'aria-label="' + esc(article.title) + '"></a>'
      + '<div class="mob-art-cover" style="background:' + coverBg(article.slug) + ';"></div>'
      + '<div class="mob-art-body">'
      +   '<div class="mob-art-title">' + esc(article.title) + '</div>'
      +   '<div class="mob-art-excerpt">' + esc(article.excerpt) + '</div>'
      +   '<div class="mob-art-meta">'
      +     '<span>' + fmtDate(article.date) + '</span>'
      +     '<span class="dot">·</span>'
      +     '<span>' + (article.readMins || 5) + ' min</span>'
      +   '</div>'
      +   (function(){
          var c = chipsHtml(article, false);
          return c ? '<div class="mob-art-chips">' + c + '</div>' : '';
        })()
      + '</div>'
      + '</article>';
  }

  function mobDetailHtml(article){
    var primaryPlatform = (article.platforms && article.platforms[0]) ? article.platforms[0] : null;
    var primaryLabel = primaryPlatform ? primaryPlatform.label : 'the article';
    var primaryExternal = primaryPlatform && primaryPlatform.id !== 'site';
    var primaryHref = primaryExternal ? (primaryPlatform ? primaryPlatform.url : '#') : '#';
    var siteOriginal = isSiteArticle(article);
    return '<div class="mob-art-appbar">'
      +   '<button type="button" class="mob-art-back" onclick="mobCloseArticleDetail();return false;" aria-label="Back to Articles">'
      +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18 L9 12 L15 6"/></svg>'
      +   '</button>'
      +   '<div class="mob-art-appbar-title">Article</div>'
      + '</div>'
      + '<div class="mob-art-detail-scroll">'
      +   '<div class="mob-art-hero" style="background:' + coverBg(article.slug) + ';"></div>'
      +   '<div class="mob-art-detail-body">'
      +     '<div class="mob-art-tags-row">' + tagsHtml(article) + '</div>'
      +     '<h1 class="mob-art-h1">' + esc(article.title) + '</h1>'
      +     '<div class="mob-art-meta-row">'
      +       '<span>' + fmtDate(article.date) + '</span>'
      +       '<span class="dot">·</span>'
      +       '<span>' + (article.readMins || 5) + ' min read</span>'
      +     '</div>'
      +     '<p class="mob-art-excerpt-lg">' + esc(article.excerpt) + '</p>'
      +     (primaryExternal
        ? '<a class="mob-art-cta" href="' + esc(primaryHref) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">'
            + 'Read on ' + esc(primaryLabel)
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18"/></svg>'
            + '</a>'
        : '')
      +     takeawaysHtml(article)
      +     (siteOriginal
        ? '<section class="article-full-body" data-slug="' + esc(article.slug) + '" data-loaded="0">'
          + '<h3 class="article-section-h">Full article</h3>'
          + '<div class="article-full-content"><div class="article-loader" aria-hidden="true"><span></span><span></span><span></span></div><p class="article-loading-text">Loading the full read…</p></div>'
          + '</section>'
        : '')
      +     platformBlockHtml(article)
      +     faqHtml(article)
      +     relatedMobileHtml(article)
      +   '</div>'
      + '</div>';
  }

  function relatedMobileHtml(article){
    var rel = (window.relatedArticles ? window.relatedArticles(article, 3) : []);
    if (!rel.length) return '';
    var cards = rel.map(function(o){
      return '<a class="mob-art-related-card" href="/articles/' + esc(o.slug) + '/" '
        + 'onclick="return mobOpenArticle(\'' + esc(o.slug) + '\', event);">'
        + '<div class="mob-art-related-cover" style="background:' + coverBg(o.slug) + ';"></div>'
        + '<div class="mob-art-related-body">'
        +   '<div class="mob-art-related-title">' + esc(o.title) + '</div>'
        +   '<div class="mob-art-related-meta">' + (o.readMins || 5) + ' min</div>'
        + '</div>'
        + '</a>';
    }).join('');
    return '<section class="article-related">'
      + '<h3 class="article-section-h">Related</h3>'
      + '<div class="mob-art-related-list">' + cards + '</div>'
      + '</section>';
  }

  function mobRenderArticleList(){
    var list = document.querySelector('#mob-articles-stage .mob-articles-list');
    if (!list) return;
    list.innerHTML = (window.ARTICLES || []).map(function(a, i){ return mobCardHtml(a, i); }).join('');
    var stage = document.getElementById('mob-articles-stage');
    if (stage) stage.classList.remove('mob-articles-stage-detail');
  }

  function mobRenderArticleDetail(slug){
    var article = window.articleBySlug(slug);
    if (!article) { mobRenderArticleList(); return; }
    var stage = document.getElementById('mob-articles-stage');
    var det = document.querySelector('#mob-articles-stage .mob-articles-detail');
    if (!stage || !det) return;
    det.innerHTML = mobDetailHtml(article);
    stage.classList.add('mob-articles-stage-detail');
    var scroll = det.querySelector('.mob-art-detail-scroll');
    if (scroll) scroll.scrollTop = 0;
    injectArticleBody(det, article);
  }

  /* ===== EVENT HOOKS (called from inline onclick + app.js) ===== */

  window.openArticle = function(slug, ev){
    if (ev) ev.preventDefault();
    if (typeof window.navigate === 'function') {
      try { window.navigate('articles', { slug: slug }); } catch(e) {}
    } else {
      renderArticleDetail(slug);
    }
    return false;
  };

  window.closeArticleDetail = function(){
    if (typeof window.navigate === 'function') {
      try { window.navigate('articles'); } catch(e) {}
    } else {
      renderArticleList();
    }
    return false;
  };

  window.mobOpenArticle = function(slug, ev){
    if (ev) ev.preventDefault();
    if (typeof window.navigate === 'function') {
      try { window.navigate('articles', { slug: slug }); } catch(e) {}
    } else {
      mobRenderArticleDetail(slug);
    }
    return false;
  };

  window.mobCloseArticleDetail = function(){
    if (typeof window.navigate === 'function') {
      try { window.navigate('articles'); } catch(e) {}
    } else {
      mobRenderArticleList();
    }
    return false;
  };

  /* Public render API used by app.js router */
  window.renderArticleList = renderArticleList;
  window.renderArticleDetail = renderArticleDetail;
  window.mobRenderArticleList = mobRenderArticleList;
  window.mobRenderArticleDetail = mobRenderArticleDetail;

  /* Auto-render on DOMContentLoaded so bots and direct loads see content. */
  function bootstrap(){
    try {
      if (document.getElementById('articles-stage')) renderArticleList();
      if (document.getElementById('mob-articles-stage')) mobRenderArticleList();
    } catch(e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
