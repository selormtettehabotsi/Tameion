# Image sources

Every file here was downloaded from the Pexels CDN and is served from our own
origin so the app renders identically offline, in CI, and under a strict CSP.
Pexels content is free to use; attribution is not required but is recorded here
for provenance.

Each photo is stored at one canonical size and scaled with CSS. To re-download
or add one, fetch:

```
https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=<width>&h=<height>
```

then add the filename to `client/src/lib/images.ts` and run
`npm run verify:images`.

| File | Pexels photo id | Stored size |
|---|---|---|
| `hero.jpg` | 13770425 | 1600x900 |
| `auth.jpg` | 10323192 | 1200x1600 |
| `cover-10027581.jpg` | 10027581 | 400x600 |
| `cover-10060920.jpg` | 10060920 | 400x600 |
| `cover-1050736.jpg` | 1050736 | 400x600 |
| `cover-1098656.jpg` | 1098656 | 400x600 |
| `cover-11197155.jpg` | 11197155 | 400x600 |
| `cover-1130980.jpg` | 1130980 | 400x600 |
| `cover-1132577.jpg` | 1132577 | 400x600 |
| `cover-11839922.jpg` | 11839922 | 400x600 |
| `cover-1222551.jpg` | 1222551 | 400x600 |
| `cover-12391379.jpg` | 12391379 | 400x600 |
| `cover-1301585.jpg` | 1301585 | 400x600 |
| `cover-13556546.jpg` | 13556546 | 400x600 |
| `avatar-10417388.jpg` | 10417388 | 160x160 |
| `avatar-10500054.jpg` | 10500054 | 160x160 |
| `avatar-10554201.jpg` | 10554201 | 160x160 |
| `avatar-10604063.jpg` | 10604063 | 160x160 |
| `avatar-11395925.jpg` | 11395925 | 160x160 |
| `avatar-11655430.jpg` | 11655430 | 160x160 |
| `avatar-12311572.jpg` | 12311572 | 160x160 |
| `avatar-12497063.jpg` | 12497063 | 160x160 |
| `avatar-12750172.jpg` | 12750172 | 160x160 |
| `avatar-14183123.jpg` | 14183123 | 160x160 |
| `empty-books.jpg` | 10180449 | 600x400 |
| `empty-loans.jpg` | 10693352 | 600x400 |
| `empty-reservations.jpg` | 11377318 | 600x400 |
| `empty-members.jpg` | 16504588 | 600x400 |
