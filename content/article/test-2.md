+++
draft = false
slug = "guida-articoli"
title = "Guida: creare un articolo"
date = "2025-10-15T17:16:00+02:00"
description = "Esempio completo di articolo: front matter, slug/alias, cover, immagini, link, tabelle, codice e componenti."
tags = ["guida", "hugo", "articoli", "responsive"]
cover = ""
aliases = ["/articles/test-2/"]
+++
## Guida rapida: creare un articolo

- Permalink articoli: `/articles/:slug/` (vedi `hugo.toml`).
- Suggerito: imposta sempre uno `slug` esplicito e aggiungi `aliases` per eventuali URL precedenti.
- Cover consigliata: `static/images/articles/<slug>/cover.webp` e nel front matter `cover = "images/articles/<slug>/cover.webp"`.
- Immagini nel corpo: usa path assoluti sotto `/images/...` oppure percorsi relativi a `static/`.
- Link: usa sempre la forma Markdown `[testo](https://...)` (niente URL nude) per evitare problemi di wrapping e lint.
- Tabelle e codice: sono già gestiti in modo responsive (scroll orizzontale solo quando serve).
- Bozza: mantieni `draft = true` finché non vuoi pubblicare.
- Crea un nuovo articolo:

```bash
hugo new article/il-tuo-slug.md
```

## Esempio pratico di contenuto responsive

Questo articolo include tutti gli elementi tipici per testare (e mostrare) la resa responsive su vari viewport.

> Nota: questo articolo ├¿ un catalogo ESEMPIO COMPLETO di tutte le personalizzazioni che puoi usare nei testi.

### Test 1: Testo Lungo e Word Breaking

Questo è un paragrafo con una parola estremamente lunga per testare il word breaking: supercalifragilisticexpialidociousantidisestablishmentarianismthisisaverylongwordthatshouldbreakonmobiledevices

URL lungo per testare link: <https://www.esempio-di-url-molto-lungo-per-testare-overflow.com/questa/path/molto/lunga/che/dovrebbe/andare/a/capo>

### Test 2: Tabella Larga

| Colonna 1 | Colonna 2 | Colonna 3 | Colonna 4 | Colonna 5 | Colonna 6 | Colonna 7 | Colonna 8 |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| Dato 1    | Dato 2    | Dato 3    | Dato 4    | Dato 5    | Dato 6    | Dato 7    | Dato 8    |
| Valore A  | Valore B  | Valore C  | Valore D  | Valore E  | Valore F  | Valore G  | Valore H  |
| Test 123  | Test 456  | Test 789  | Test ABC  | Test DEF  | Test GHI  | Test JKL  | Test MNO  |

### Test 3: Codice Inline

Ecco un esempio di codice inline: `const veryLongVariableNameThatShouldBreakProperlyOnMobileDevices = "test"` e continua il testo normale.

### Test 4: Blocco di Codice Lungo

```javascript
// Questo ├¿ un blocco di codice molto lungo che dovrebbe essere scrollabile orizzontalmente su mobile
function esempioFunzioneConParametriMoltiEUnNomeEstremamenteLungoPerTestareLoScrollOrizzontale(parametro1, parametro2, parametro3, parametro4) {
  const variabileMoltoLungaPerTestareLoScrollOrizzontale = "Questo ├¿ un valore molto lungo";
  console.log("Questa riga è estremamente lunga e dovrebbe richiedere scroll orizzontale su dispositivi mobili ma non dovrebbe rompere il layout della pagina");
  return variabileMoltoLungaPerTestareLoScrollOrizzontale.split('').map(char => char.toUpperCase()).join('');
}
```

### Test 5: Lista con Elementi Lunghi

- Questo ├¿ un elemento di lista molto lungo che contiene una descrizione dettagliata per testare come il testo va a capo su dispositivi mobili e se mantiene la corretta indentazione e spaziatura
- URL in lista: <https://www.esempio-url-lunghissimo-nella-lista.com/path/molto/lungo/da/testare>
- Elemento con parola lunga: supercalifragilisticexpialidocious
- **Elemento enfatizzato**: Testo con formattazione **grassetto** e *corsivo* mescolati insieme con un link [questo è un link molto lungo che dovrebbe andare a capo](https://esempio.com)

### Test 6: Lista Numerata

1. Primo elemento della lista numerata con testo molto lungo per verificare l'allineamento e la gestione dello spazio su dispositivi mobili piccoli
2. Secondo elemento con codice inline `const variabileConNomeLungo = "valore"` nel mezzo del testo
3. Terzo elemento con [link molto lungo: https://www.sito-con-url-estremamente-lungo.com/path/complessa](https://www.sito-con-url-estremamente-lungo.com/path/complessa)

### Test 7: Blockquote

> Questo ├¿ un blockquote molto lungo che serve per testare come il testo viene gestito all'interno delle citazioni su diversi viewport. Il blockquote dovrebbe mantenere una buona leggibilit├á anche su dispositivi mobili piccoli e il testo dovrebbe andare a capo correttamente senza causare overflow orizzontale. Questo ├¿ particolarmente importante per citazioni che contengono URL lunghi come <https://www.esempio-url-lungo-in-blockquote.com/path/molto/lunga> o parole tecniche lunghe.

### Test 8: Pulsanti

Ecco una collezione di pulsanti per testare il layout responsive:

{{< article-buttons >}}

Esempio pulsanti personalizzati (shortcode con parametri):

<!-- markdownlint-disable MD034 -->
{{< article-buttons count="3" label1="Vai alla Home" href1="/" class1="btn--sm" label2="GitHub" href2="https://github.com/eventhorizon-mtg" class2="btn--sm" label3="YouTube" href3="https://youtube.com" class3="btn--yt btn--sm" >}}
<!-- markdownlint-enable MD034 -->

**Test pulsanti grandi vs piccoli:**

<!-- markdownlint-disable MD034 -->
{{< article-buttons count="3"
  label1="Pulsante Grande" href1="#" class1="btn--primary btn-lg"
  label2="Pulsante Normale" href2="#" class2="btn--secondary"
  label3="Altro Grande" href3="#" class3="btn--special btn--large" >}}
<!-- markdownlint-enable MD034 -->

### Test 9: Pulsanti Glass

{{< article-buttons variant="glass" >}}

### Test 10: Immagine

![Test Image](https://via.placeholder.com/1200x600/1a1a2e/eee?text=Test+Image+Responsive)

Immagine allineata al centro usando attribute list:

![Center Image](https://via.placeholder.com/800x400/111/ddd?text=Centered)
{.text-center}

### Test 11: Codice con Sintassi Colorata

```python
# Python code con righe molto lunghe
def funzione_con_nome_estremamente_lungo_per_testare_overflow(parametro_uno, parametro_due, parametro_tre):
    """
    Questa è una docstring molto lunga che serve per testare come viene gestito
    il testo all'interno dei blocchi di codice su dispositivi mobili.
    """
    dizionario_di_esempio = {
        "chiave_molto_lunga_numero_uno": "valore_altrettanto_lungo_per_testare",
        "chiave_molto_lunga_numero_due": "altro_valore_lungo_da_verificare",
    }
    return dizionario_di_esempio["chiave_molto_lunga_numero_uno"].upper().replace("_", " ").strip()
```

Esempio di allineamenti del testo:

Paragrafo centrato con attribute list {.text-center}:

Questo testo è centrato
{.text-center}

Paragrafo giustificato con shortcode align:

{{< align dir="justify" >}}
Questo paragrafo dimostra l'uso dello shortcode di allineamento per giustificare il testo su tutta la larghezza disponibile. Funziona anche con contenuti lunghi e va a capo correttamente.
{{< /align >}}

### Test 12: HTML Inline

{{< article-box style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;" >}}
**Contenitore HTML personalizzato:** Questo testo ├¿ all'interno di un div con stili inline per testare la gestione di HTML custom all'interno degli articoli.

- Elemento lista dentro HTML
- Altro elemento con `codice inline`
{{< /article-box >}}

Varianti di box (info/avviso/successo/pericolo):

{{< article-box class="article-box article-box--info" >}}
Questa è una nota informativa.
{{< /article-box >}}

{{< article-box class="article-box article-box--warning" >}}
Attenzione: operazione potenzialmente rischiosa.
{{< /article-box >}}

{{< article-box class="article-box article-box--success" >}}
Operazione completata con successo.
{{< /article-box >}}

{{< article-box class="article-box article-box--danger" >}}
Errore critico: controlla i log.
{{< /article-box >}}

### Test 13: Link Multipli

Ecco alcuni link uno dopo l'altro: [Link 1](https://esempio1.com) ┬À [Link 2 con testo lungo](https://esempio2.com) ┬À [Link 3](https://esempio3.com) ┬À [Link 4 con descrizione estesa](https://esempio4.com)

Link esterno con testo lungo allineato a destra:

[Questo ├¿ un link molto lungo verso una risorsa esterna che dovrebbe andare a capo correttamente senza rompere il layout](https://www.example.com/path/molto/lungo/di/test/che/si/prolunga/ancora/di/piu)
{.text-right}

### Test 14: Nested Lists

- Primo livello
  - Secondo livello item 1
  - Secondo livello item 2 con testo molto lungo per testare l'indentazione su dispositivi mobili
    - Terzo livello con testo ancora pi├╣ lungo per verificare la gestione delle liste annidate profonde
  - Ritorno al secondo livello
- Primo livello item 2
  - Altro elemento secondo livello con `codice inline molto_lungo_per_testare`

### Test 15: Horizontal Rule

- - -

Testo dopo la linea orizzontale.

## Conclusioni Test

Questo articolo include tutti gli elementi tipici che dovrebbero essere testati su:

- **Mobile piccolo**: 320px - 375px
- **Mobile standard**: 375px - 414px  
- **Tablet**: 768px - 834px
- **Desktop**: 1024px - 1440px
- **Large desktop**: 1920px+

Ogni elemento dovrebbe:

- Non causare overflow orizzontale
- Essere completamente leggibile
- Mantenere spaziatura appropriata
- Permettere scroll dove necessario (tabelle, code blocks)
- Adattarsi fluidamente tra breakpoint

- - -

## Cheat Sheet Autori

Di seguito una raccolta veloce e copiabile delle personalizzazioni disponibili negli articoli.

### Allineamenti

**Nota**: L'attributo deve essere su una riga separata, sotto l'elemento da allineare.

Paragrafo centrato:

Questo paragrafo ├¿ centrato
{.text-center}

Paragrafo allineato a destra:

Questo paragrafo ├¿ allineato a destra
{.text-right}

Immagine centrata (stessa sintassi):

![Alt text](path/to/image.jpg)
{.text-center}

Shortcode `align` per allineamenti multipli (left/center/right/justify):

{{< align dir="justify" >}}
Testo giustificato su tutta la larghezza disponibile.
{{< /align >}}

{{< align dir="center" >}}
Testo centrato usando lo shortcode.
{{< /align >}}

### Pulsanti personalizzati

<!-- markdownlint-disable MD034 -->
{{< article-buttons count="2" label1="Apri guida" href1="/articles/guida-articoli/" class1="btn--sm" label2="Repository" href2="https://github.com/eventhorizon-mtg/eventhorizon-mtg.github.io" class2="btn--sm" >}}
<!-- markdownlint-enable MD034 -->

### Pulsanti: dimensioni

Di default i pulsanti negli articoli sono **piccoli** per integrarsi meglio con il testo. Per usare pulsanti pi├╣ grandi e prominenti, aggiungi la classe `.btn-lg` o `.btn--large`:

**Pulsanti piccoli (default):**

```html
<a href="#" class="btn btn--primary">Bottone Piccolo</a>
<a href="#" class="pill">Pill Piccola</a>
```

**Pulsanti grandi:**

```html
<a href="#" class="btn btn--primary btn-lg">Bottone Grande</a>
<a href="#" class="pill btn--large">Pill Grande</a>
```

Con lo shortcode `article-buttons`, aggiungi `btn-lg` o `btn--large` alla classe:

```go-html-template
{{< article-buttons count="2"
  label1="Azione Importante" href1="#" class1="btn--primary btn-lg"
  label2="Azione Secondaria" href2="#" class2="btn--secondary btn-lg" >}}
```

**Esempio pratico:**

<!-- markdownlint-disable MD034 -->
{{< article-buttons count="2"
  label1="Pulsante Grande" href1="#" class1="btn--primary btn-lg"
  label2="Pulsante Piccolo" href2="#" class2="btn--secondary" >}}
<!-- markdownlint-enable MD034 -->

### Pulsanti tondi

Shortcode equivalente:

{{< round-buttons >}}

Shortcode con parametri:

```go-html-template
{{< round-buttons size="lg" items="link:primary,mail:secondary,discord:special-glass,youtube:accent-glass,i:circle-outline" >}}
```

I pulsanti tondi riusano le colorazioni esistenti e sono ideali per azioni solo-icona.

Esempio live:

<div class="round-buttons-demo">
  <button class="btn btn--circle btn--primary btn--circle-md" aria-label="Apri link">
    <span class="contact__icon icon-link" aria-hidden="true"></span>
  </button>
  <button class="btn btn--circle btn--secondary btn--circle-sm" aria-label="Email">
    <span class="contact__icon icon-mail" aria-hidden="true"></span>
  </button>
  <button class="btn btn--circle btn--special-glass btn--circle-lg" aria-label="Special action">
    <span class="contact__icon icon-discord" aria-hidden="true"></span>
  </button>
  <button class="btn btn--circle btn--accent-glass btn--circle-md" aria-label="YouTube">
    <span class="contact__icon icon-youtube" aria-hidden="true"></span>
  </button>
  <button class="btn--circle btn--circle-primary btn--circle-md" aria-label="Info">i</button>
  <button class="btn--circle btn--circle-outline btn--circle-md" aria-label="Vuoto">&bull;</button>
</div>

Snippet HTML base (con `.btn`):

```html
<button class="btn btn--circle btn--primary btn--circle-md" aria-label="Azione">
  <span class="contact__icon icon-link" aria-hidden="true"></span>
  <!-- In alternativa, una lettera/simbolo: es. i, &bull; -->
</button>
```

Varianti standalone (senza `.btn`) e taglie:

```html
<!-- Colori: primary | secondary | special | accent | success | warning | error | info -->
<button class="btn--circle btn--circle-primary btn--circle-sm" aria-label="Azione">i</button>
<button class="btn--circle btn--circle-secondary btn--circle-md" aria-label="Azione">&bull;</button>
<button class="btn--circle btn--circle-accent btn--circle-lg" aria-label="Azione">+</button>

<!-- Outline neutro -->
<button class="btn--circle btn--circle-outline btn--circle-md" aria-label="Azione">&bull;</button>
```

Varianti "glass" circolari:

```html
<button class="btn btn--circle btn--circle-primary-glass" aria-label="Azione">
  <span class="contact__icon icon-link" aria-hidden="true"></span>
</button>
```

### Pulsanti rounded

I pulsanti con bordo arrotondato (pill) funzionano con tutte le colorazioni, incluse le varianti brand “glass”.

Esempio live:

<p class="round-buttons-demo">
  <a href="#" class="btn btn--rounded btn--primary">Primary</a>
  <a href="#" class="btn btn--rounded btn--secondary">Secondary</a>
  <a href="#" class="btn btn--rounded btn--special">Special</a>
  <a href="#" class="btn btn--rounded btn--accent">Accent</a>
  <a href="#" class="btn btn--rounded btn--yt-glass" aria-label="YouTube"><span class="contact__icon icon-youtube" aria-hidden="true"></span></a>
  <a href="#" class="btn btn--rounded btn--mox-glass">Mox</a>
  <a href="#" class="btn btn--rounded btn--scry-glass">Scry</a>
  <a href="#" class="btn btn--rounded btn--edh-glass">EDH</a>
  <a href="#" class="btn btn--rounded btn--archi-glass">Archi</a>
  
</p>

Snippet HTML:

```html
<a class="btn btn--rounded btn--yt-glass" aria-label="YouTube">
  <span class="contact__icon icon-youtube" aria-hidden="true"></span>
</a>
<a class="btn btn--rounded btn--mox-glass">Mox</a>
```

### Pulsanti solo icona

I “icon-only” sono bottoni circolari che contengono solo un’icona. Taglie disponibili: `btn--icon-sm`, `btn--icon-md` (default), `btn--icon-lg`.

Esempio live:

<p class="round-buttons-demo">
  <button class="btn btn--icon-only btn--icon-sm btn--secondary" aria-label="Apri link">
    <span class="contact__icon icon-link" aria-hidden="true"></span>
  </button>
  <button class="btn btn--icon-only btn--icon-md btn--yt-glass" aria-label="YouTube">
    <span class="contact__icon icon-youtube" aria-hidden="true"></span>
  </button>
  <button class="btn btn--icon-only btn--icon-lg btn--special-glass" aria-label="Discord">
    <span class="contact__icon icon-discord" aria-hidden="true"></span>
  </button>
  <button class="btn btn--icon-only btn--icon-md btn--accent" aria-label="Email">
    <span class="contact__icon icon-mail" aria-hidden="true"></span>
  </button>
</p>

Snippet HTML:

```html
<button class="btn btn--icon-only btn--icon-md btn--yt-glass" aria-label="YouTube">
  <span class="contact__icon icon-youtube" aria-hidden="true"></span>
</button>
```

### Box / Callout

{{< article-box class="article-box article-box--info" >}}
Info: usa questa variante per note informative.
{{< /article-box >}}

{{< article-box class="article-box article-box--warning" >}}
Warning: evidenzia attenzioni o prerequisiti.
{{< /article-box >}}

{{< article-box class="article-box article-box--success" >}}
Success: conferme e risultati positivi.
{{< /article-box >}}

{{< article-box class="article-box article-box--danger" >}}
Danger: errori critici o azioni distruttive.
{{< /article-box >}}

### Immagini

Immagine centrata:

![Cover](images/articles/slug/cover.webp)
{.text-center}

### Liste annidate

- Primo livello
  - Secondo livello
    - Terzo livello con testo lungo per verificare il wrapping

### Tabella e codice

| Col 1 | Col 2 | Col 3 |
| ----- | ----- | ----- |
| A     | B     | C     |

```js
// Blocco di codice breve (scrolla se necessario su mobile)
const msg = "Hello, EventHorizon";
console.log(msg);
```
