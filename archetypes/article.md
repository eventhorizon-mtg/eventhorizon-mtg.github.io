+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = '{{ .Date }}'
draft = true

# SEO

description = ''
tags = []

# Media

cover = ''   # es: images/articles/slug/cover.webp (oppure URL assoluto)

+++

## Sommario

Scrivi qui l'introduzione dell'articolo.

## Contenuto

Testo articolo...

### Allineamento testo e contenuti

- Attributi Goldmark (consigliato):
  
Paragrafo centrato
  
Questo testo sarà centrato {.text-center}
  
Immagine a destra:
  
![Alt text](images/articles/slug/cover.webp){.text-right}

- Shortcode (alternativa):
  
{{< align dir="center" >}}
Questo blocco è centrato
{{< /align >}}

### Best practice responsive

- Usa sempre link Markdown `[testo](https://...)` (evita URL nude)
- Tabelle e codice: saranno scrollabili su mobile; mantieni righe ragionevoli
- Immagini: usa percorsi assoluti `/images/...` o `images/articles/<slug>/...` e dimensioni adeguate
- Evita HTML inline; se serve un box, usa `{{< article-box >}}...{{< /article-box >}}`
