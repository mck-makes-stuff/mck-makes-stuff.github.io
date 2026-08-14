# mck-makes-stuff.github.io

Source for my personal site, live at
[mck-makes-stuff.github.io](https://mck-makes-stuff.github.io).

I'm Gail McKinney. I study mathematics and computer science at Yale and work on
AI, mostly evaluation methodology. The site collects my background,
projects, and a bit about what I find interesting.

## built with

A static [Jekyll](https://jekyllrb.com) site, hosted on GitHub Pages. 

Page content lives in `_data/` as YAML, so the templates in the repo root stay
thin and adding an entry means editing a data file rather than markup. Styles
are a single hand-written stylesheet in `assets/css/`, no framework.

Type is Newsreader for display, IBM Plex Sans for body text, and IBM Plex Mono
for labels. The curve on the home page is an item characteristic curve, drawn
inline as SVG.

## running it locally

```
bundle install
bundle exec jekyll serve
```

Then open `http://localhost:4000`.

## reuse

The site design and code are MIT licensed, so borrow the structure freely.
The written content and my personal information are not.
