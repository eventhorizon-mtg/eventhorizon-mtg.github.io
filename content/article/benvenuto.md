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

> «La magia è credere in se stessi.»

#### Tabella

| Nome | Tipo     | Link                        |
|------|----------|-----------------------------|
| Mox  | Esterno  | https://moxfield.com/       |
| Arch | Interno  | [/archive/](/archive/)      |


### Bottoni (shortcode)

Esempi di bottoni usando lo shortcode `button`:

{{< button href="/archive/" label="Vai all'Archivio" variant="btn--base" >}}{{< /button >}}
{{< button href="/privacy-policy/" label="Privacy" variant="btn--indigostroke" >}}{{< /button >}}
{{< button href="https://moxfield.com/users/EventHorizonMtG" label="Moxfield" variant="btn--gold" target="_blank" >}}{{< /button >}}
{{< button href="https://www.youtube.com/@EventHorizonMtG" label="YouTube" variant="btn--pink" target="_blank" >}}{{< /button >}}
{{< button href="#" label="Disabled (demo)" variant="btn--disabled1" >}}{{< /button >}}

#### Allineamenti e layout

Allinea al centro un paragrafo e un'immagine:

{{< align pos="center" >}}
Questo paragrafo è centrato.

![Center](/images/bg_image.webp)
{{< /align >}}

Allinea a destra (testo e immagine):

{{< align pos="right" >}}
Questo testo è allineato a destra.

![Right](/icons/favicon/favicon-192.png)
{{< /align >}}

Immagine con float a destra e testo a lato:

{{< figure src="/images/bg_image.webp" alt="Float Right" class="float-right w-33" caption="Float a destra + width 33%" >}}

Testo che scorre intorno all'immagine flottata. Aggiungi altro testo per vedere l'effetto del wrapping attorno all'immagine in colonna stretta. Continuiamo a scrivere per più righe così si nota l'effetto a colpo d'occhio.

{{< align pos="center" >}}
Figura full-bleed (tocca i margini orizzontali):
{{< figure src="/images/bg_image.webp" alt="Full bleed" class="is-full-bleed" caption="Esempio full-bleed" >}}
{{< /align >}}

Gruppi di bottoni con allineamento:

{{< btn-group align="center" >}}
  {{< button href="/archive/" label="Archivio" variant="btn--base" >}}{{< /button >}}
  {{< button href="/privacy-policy/" label="Privacy" variant="btn--indigostroke" >}}{{< /button >}}
{{< /btn-group >}}

{{< btn-group align="right" >}}
  {{< button href="https://moxfield.com/users/EventHorizonMtG" label="Moxfield" variant="btn--gold" target="_blank" >}}{{< /button >}}
  {{< button href="https://www.youtube.com/@EventHorizonMtG" label="YouTube" variant="btn--pink" target="_blank" >}}{{< /button >}}
{{< /btn-group >}}
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

