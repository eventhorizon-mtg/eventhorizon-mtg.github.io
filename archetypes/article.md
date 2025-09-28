++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = '{{ .Date }}'
draft = true

# SEO (opzionali)
description = ''
tags = []
# ogTitle   = ''
# ogDesc    = ''
# ogImage   = ''   # es: "images/articles/{{ .File.ContentBaseName }}/share.webp" (oppure URL assoluto)
# canonical = ''

++

## Sommario

Scrivi qui l'introduzione dell'articolo (puoi usare anche un paragrafo con tono "lead").

## Contenuto

Testo articolo...

### Immagini inline

Inserisci le immagini direttamente nel corpo dell'articolo (la cover hero è stata rimossa). 
Percorsi consigliati:

- Metti i file in `static/images/articles/{{ .File.ContentBaseName }}/...`
- Referenziali con percorso assoluto: `/images/articles/{{ .File.ContentBaseName }}/file.webp`

Esempio:

`![Descrizione](/images/articles/{{ .File.ContentBaseName }}/cover.webp)`


