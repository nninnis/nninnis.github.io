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

    {% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
    {% for year in posts_by_year %}
    <div class="archive-year">
      <h2>{{ year.name }}</h2>
      <ul class="archive-list">
        {% for post in year.items %}
        <li>
          <a href="{{ post.url | relative_url }}">
            <span class="archive-date">{{ post.date | date: "%m.%d" }}</span>
            <span class="archive-title">{{ post.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    {% endfor %}

    {% if site.posts.size == 0 %}
    <p class="empty">...</p>
    {% endif %}
  </section>
</main>

<footer class="footer">
  <p>&copy; {{ site.time | date: "%Y" }}</p>
</footer>
