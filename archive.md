---
layout: default
title: Archive
permalink: /archive/
---

{% include nav.html %}

<main class="main archive-main">
  <section class="archive">
    <h1>Archive</h1>

    <div class="filter-chips" role="tablist" aria-label="카테고리 필터">
      <button type="button" class="filter-chip is-active" data-filter="all" role="tab" aria-selected="true">All</button>
      <button type="button" class="filter-chip" data-filter="claude-code" role="tab" aria-selected="false">Claude Code</button>
      <button type="button" class="filter-chip" data-filter="ai" role="tab" aria-selected="false">AI</button>
      <button type="button" class="filter-chip" data-filter="dev" role="tab" aria-selected="false">Dev</button>
      <button type="button" class="filter-chip" data-filter="game" role="tab" aria-selected="false">Game</button>
      <button type="button" class="filter-chip" data-filter="painting-star" role="tab" aria-selected="false">Painting Star</button>
    </div>

    {% assign ps_posts = site.posts | where: "category", "painting-star" %}
    {% assign game_posts = site.posts | where: "category", "game" %}
    {% assign other_posts = site.posts | where_exp: "post", "post.category != 'painting-star'" | where_exp: "post", "post.category != 'game'" %}

    {% if ps_posts.size > 0 %}
    <div class="archive-category">
      <h2>Painting Star</h2>
      <ul class="archive-list">
        {% for post in ps_posts %}
        <li data-category="{{ post.category }}">
          <a href="{{ post.url | relative_url }}">
            <span class="archive-date">{{ post.date | date: "%m.%d" }}</span>
            <span class="archive-title">{{ post.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}

    {% if game_posts.size > 0 %}
    <div class="archive-category">
      <h2>게임</h2>
      <ul class="archive-list">
        {% for post in game_posts %}
        <li data-category="{{ post.category }}">
          <a href="{{ post.url | relative_url }}">
            <span class="archive-date">{{ post.date | date: "%m.%d" }}</span>
            <span class="archive-title">{{ post.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}

    {% if other_posts.size > 0 %}
    <div class="archive-category">
      <h2>AI · 개발</h2>
      <ul class="archive-list">
        {% for post in other_posts %}
        <li data-category="{{ post.category }}">
          <a href="{{ post.url | relative_url }}">
            <span class="archive-date">{{ post.date | date: "%m.%d" }}</span>
            <span class="archive-title">{{ post.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}

    {% if site.posts.size == 0 %}
    <p class="empty">...</p>
    {% endif %}

    <p class="archive-empty-state" hidden>해당 카테고리에 글이 없다.</p>
  </section>
</main>

<footer class="footer">
  <p>&copy; {{ site.time | date: "%Y" }}</p>
</footer>
