# Quran text source and licence

The display text in this directory is the **Uthmani, Version 1.1** text
downloaded from the official [Tanzil Project download page](https://tanzil.net/download/).
The separate search index is made from Tanzil's **Simple Clean, Version 1.1**
text. Structural surah metadata comes from Tanzil's official
[`quran-data.xml`](https://tanzil.net/res/text/metadata/quran-data.xml), version 1.0.
The per-ayah juz and Medina Mushaf page numbers are assigned only from the 30
juz and 604 page start coordinates in that same official metadata file; they
are never estimated or calculated from ayah counts.

The exact download options, retrieval timestamp, URLs, versions, and pinned
SHA-256 values are recorded in [`source-receipt.json`](./source-receipt.json).
The original downloaded files, including their copyright blocks, are retained
verbatim under [`source/`](./source/).

## Tanzil copyright notice

    Tanzil Quran Text
    Copyright (C) 2007-2026 Tanzil Project
    License: Creative Commons Attribution 3.0

    This copy of the Quran text is carefully produced, highly
    verified and continuously monitored by a group of specialists
    at Tanzil Project.

    TERMS OF USE:

    - Permission is granted to copy and distribute verbatim copies
      of this text, but CHANGING IT IS NOT ALLOWED.

    - This Quran text can be used in any website or application,
      provided that its source (Tanzil Project) is clearly indicated,
      and a link is made to tanzil.net to enable users to keep
      track of changes.

    - This copyright notice shall be included in all verbatim copies
      of the text, and shall be reproduced appropriately in all files
      derived from or containing substantial portion of this text.

    Please check updates at: http://tanzil.net/updates/

Official licence page: <https://tanzil.net/docs/Text_License>  
Creative Commons Attribution 3.0: <https://creativecommons.org/licenses/by/3.0/>

## Basmala representation

No basmala is split, inserted, removed, or recomputed during import. The JSON
preserves Tanzil's numbered-text representation exactly:

- Al-Fatiha 1:1 consists of the basmala.
- In every surah other than Al-Fatiha and At-Tawbah, the basmala is the prefix
  of ayah 1 on the same source line; it is not counted as an additional ayah.
- At-Tawbah 9:1 does not contain a basmala prefix.

## Reproducible import

From the repository root, run:

```sh
node scripts/import-quran.ts
node scripts/validate-quran.ts
```

The import is offline. It never downloads or edits Quran text. It refuses to
run unless all three source files match the pinned SHA-256 values, the two text
editions have identical 6,236 verse coordinates, and all 114 surahs agree with
the official metadata. It also requires every official juz/page boundary to
point to an existing coordinate. `validate-quran.ts` then checks structure,
exact source text and partition equality, and every generated-file checksum in
`integrity.json`.
