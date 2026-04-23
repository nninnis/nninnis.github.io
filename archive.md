---
layout: default
title: Archive
permalink: /archive/
---

<header class="header">
  <nav class="nav">
    <a href="{{ '/' | relative_url }}">home</a>
    <a href="{{ '/about/' | relative_url }}">about</a>
    <a href="{{ '/archive/' | relative_url }}">archive</a>
  </nav>
</header>

<main class="main archive-main">
  <section class="archive">
    <h1>Archive</h1>

    {% assign ps_posts = site.posts | where: "category", "painting-star" %}
    {% assign game_posts = site.posts | where: "category", "game" %}
    {% assign other_posts = site.posts | where_exp: "post", "post.category != 'painting-star' and post.category != 'game'" %}

    {% if ps_posts.size > 0 %}
    <div class="archive-category">
      <h2>Painting Star</h2>
      <ul class="archive-list">
        {% for post in ps_posts %}
        <li>
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
        <li>
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
        <li>
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
  </section>
</main>

<footer class="footer">
  <p>&copy; {{ site.time | date: "%Y" }}</p>
</footer>
