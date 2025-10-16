+++
title = "Benvenuto"
date = "2025-10-15T18:58:00.000+02:00"
draft = false
description = "Che cos'è la sezione Articoli e come verrà usata sul sito."
tags = ["benvenuto"]
+++
## Benvenuto

Questa è una pagina **Articolo** di esempio generata nella sezione `article`.

* Ha un header con data, tag, titolo, descrizione e un'immagine di copertina (parametro `cover`).
* Il contenuto è Markdown normale: titoli, liste, link, immagini, ecc.
* L'URL è configurato come `/articles/benvenuto-su-eventhorizon.mtg/` tramite i `permalinks` in `hugo.toml`.

### Come creare un nuovo articolo

1. `hugo new article/<slug>.md`
2. Compila i campi nel front matter (titolo, descrizione, tag, cover)
3. Imposta `draft = false` quando vuoi pubblicarlo

### Esempio di immagine inline

Puoi inserire immagini dal tuo `static/images/...`:

![Hero]()

Oppure, meglio, organizza le immagini per ogni articolo in `static/images/articles/<slug>/` e referenziale come `images/articles/<slug>/file.webp`.

Buona scrittura!

### Esempi di pulsanti

Di seguito alcuni esempi dei pulsanti disponibili sul sito:

Per evitare HTML inline (e avvisi del linter), usa lo shortcode:

```go-html-template
{{< article-buttons >}}
```

### Varianti glass/trasparent

Variante “glass” con shortcode:

```go-html-template
{{< article-buttons variant="glass" >}}
```

Esempio di pulsanti personalizzati senza HTML inline:

```go-html-template
{{< article-buttons count=2 
  label1="Vai al video" href1="https://youtube.com/" class1="btn--yt" 
  label2="Decklist" href2="https://www.moxfield.com/" class2="btn--mox" >}}
```
