# Writing fails

A collection of accidental readings, from flipped signs and bad line breaks to typos and mistranslations. Browse the gallery at [writing-fails.mkpo.li](https://writing-fails.mkpo.li/) or [submit an example](https://github.com/mkpoli/writing-fails/issues/new?template=example.yml).

## Languages

English is at `/`, Japanese at `/ja/`, Simplified Chinese at `/zh/` and Korean at `/ko/`. Each page is generated from `content/entries.json` and the message catalogues in `locales/`. Entries carry a language and a kind: direction, layout, flipped, look-alike, typo, wording, unfamiliar, translation or damage. Images are credited, and linked to their sources where a public one exists.

Serve the directory with any HTTP server to move between languages:

```sh
python3 -m http.server
```

Opening `index.html` from disk shows the English page, but its language links need the server.

## Icons

The favicon and app icons live in `assets/`, with `favicon.ico` at the root for older clients. The build writes a manifest for each language.

## Development

```sh
bun install
bun run build
bun run check
```

`bun run build` writes the four HTML pages. `bun run check` runs [x18n](https://x18n.dev/) against the catalogues for missing, unused and invalid keys. `bun run verify` runs the check, rebuilds and fails when the committed pages are out of date. CI runs the same steps.

## Sponsor

I build Writing fails on my own, with no funding behind it, and it's free for everyone. If it's useful to you, a tip on [Ko-fi](https://ko-fi.com/mkpoli) gives me time to keep improving it. Companies interested in sponsoring can write to mkpoli@mkpo.li.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/mkpoli)

## License

Original site text and code are dedicated to the public domain under [CC0 1.0](LICENSE). Third-party photographs and images remain subject to their respective rights and are not covered by this dedication; follow the source links for attribution and permissions.
