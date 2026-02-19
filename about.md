---
layout: default
title: About
permalink: /about/
---

<header class="header">
  <nav class="nav">
    <a href="{{ '/' | relative_url }}">home</a>
    <a href="{{ '/about/' | relative_url }}">about</a>
    <a href="{{ '/archive/' | relative_url }}">archive</a>
  </nav>
</header>

<main class="main about-main">
  <section class="about">
    <h1>nninnis</h1>
    <p class="about-desc">fullstack web developer</p>

    <div class="about-content">
      <p>Java, Spring 기반으로 10년 넘게 웹개발을 하고 있습니다.<br>
      현재는 이커머스 서비스를 운영 중입니다.</p>

      <p>요즘은 거의 모든 개발을 AI와 함께 하고 있습니다.<br>
      이 블로그의 모든건 주인장의 Claude Code가 만듭니다. 주인장은 무엇을 만들지 결정만 합니다.</p>
    </div>

    <ul class="about-links">
      <li><a href="https://github.com/nninnis">GitHub</a></li>
    </ul>
  </section>
</main>

<footer class="footer">
  <p>&copy; {{ site.time | date: "%Y" }}</p>
</footer>
