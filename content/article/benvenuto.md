+++
title = "Benvenuto su EventHorizon.mtg"
date = 2025-09-27T12:00:00Z
draft = false

# SEO
description = "Che cos'è la sezione Articoli e come verrà usata sul sito."
tags = []

+++

## Benvenuto!

Questa è una pagina **Articolo** di esempio generata nella sezione `article`.

- Header: data, tag, titolo e descrizione (niente più cover a tutta larghezza).
- Contenuto: Markdown normale (titoli, liste, link, immagini, tabelle, codice...).
- URL: configurato come `/articles/benvenuto-su-eventhorizon.mtg/` dai `permalinks` in `hugo.toml`.

> Nota: le immagini inline funzionano se il percorso parte dalla radice del sito. L'immagine `images/bg_image.webp` non si vedeva perché era relativa alla pagina; usa invece `/images/bg_image.webp`.

---

### Esempi di asset del sito

#### Immagini (inline)

Hero globale (da `static/images/bg_image.webp`):

![Hero](/images/bg_image.webp)

Icona 192×192 (da `static/icons/...`):

![Icona](/icons/favicon/favicon-192.png)

Consiglio: per ogni articolo organizza le immagini in `static/images/articles/<slug>/` e referenziale così:

`/images/articles/<slug>/file.webp`

#### Link interni

- Vai all'Archivio: [/archive/](/archive/)
- Privacy Policy: [/privacy-policy/](/privacy-policy/)

#### Liste

- Punto elenco uno
- Punto elenco due
  - Sotto-elenco

1. Primo
2. Secondo

#### Citazione

> “La magia è credere in se stessi.”

#### Tabella

| Nome | Tipo     | Link                        |
|------|----------|-----------------------------|
| Mox  | Esterno  | https://moxfield.com/       |
| Arch | Interno  | [/archive/](/archive/)      |

#### Codice

Esempio inline `fetch('/archive/list.json')`.

```js
// Esempio generico
async function loadArchive() {
  const res = await fetch('/archive/list.json');
  const data = await res.json();
  console.log('items:', data.length);
}
```

---

### Come creare un nuovo articolo

1. `hugo new article/<slug>.md`
2. Compila il front matter (titolo, descrizione, tag)
3. Inserisci immagini inline usando percorsi assoluti (es. `/images/articles/<slug>/cover.webp`)
4. Imposta `draft = false` quando vuoi pubblicarlo

Buona scrittura!
