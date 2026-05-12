---
layout: default
title: About
permalink: /about/
---

<header class="header">
  <nav class="nav">
    <a href="{{ '/' | relative_url }}">home</a>
    <a href="{{ '/archive/' | relative_url }}">archive</a>
    <a href="{{ '/about/' | relative_url }}">about</a>
  </nav>
</header>

<main class="main about-main">
  <section class="about">
    <h1>nninnis</h1>
    <p class="about-desc">1인 개발</p>

    <div class="about-content">
      <p>이커머스 사이트 운영 · 설계</p>
      <p>AI 기반 게임 · 코인 자동매매 프로그램 개발</p>
    </div>

    <ul class="about-meta">
      <li><span class="about-key">글</span><span class="about-val">AI · Claude Code · 1인 개발</span></li>
      <li><span class="about-key">출시작</span><span class="about-val"><a href="https://apps.apple.com/kr/app/painting-star/id6762936757" target="_blank" rel="noopener">Painting Star &rarr;</a></span></li>
    </ul>

    <ul class="about-links">
      <li><a href="mailto:nninnis.dev@gmail.com">nninnis.dev@gmail.com</a></li>
      <li><a href="https://github.com/nninnis" target="_blank" rel="noopener">GitHub</a></li>
    </ul>
  </section>
</main>

<footer class="footer">
  <p>&copy; {{ site.time | date: "%Y" }}</p>
</footer>
