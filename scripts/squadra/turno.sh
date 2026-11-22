#!/bin/bash
# I TURNI DI SKINMATCH SUL MAC (22/11/2026).
#
# ⚠️ PERCHÉ ESISTE. Fino al 22/11 i turni di Skinmatch partivano da ~/Agoranomos/squadra/turno.sh, contro la regola
# «niente di Agoranomos per Skinmatch» (account, script, MCP). Il PO, 22/11: «sì», spostali in Skinmatch. Qui ci sono
# solo i turni di Skinmatch; launchd li lancia con le etichette com.skinmatch.squadra.*.
#
#   turno.sh mattina         ogni mattina, zero token: vendite, catalogo, articoli approvati
#   turno.sh pubblica        ogni 20 minuti, zero token: gli articoli approvati vanno online
#   turno.sh zeno rivista    un giorno ogni due (dal 16/10/2026): un articolo per la Rivista
#   turno.sh zeno novita     il lunedì: le novità della settimana
#   turno.sh zeno schede     lunedì, mercoledì e venerdì: l'INCI che manca alle schede
#   turno.sh zeno testi      martedì e venerdì: i testi del test, più autorevoli e meno da IA
#   turno.sh friday seo      nel giro del sabato: la ricercabilità di Skinmatch (Friday, dal 22/11/2026)
#   turno.sh settimana       il sabato pomeriggio: i turni con agente rimasti in coda, in fila
#
# ⚠️ UN AGENTE ALLA VOLTA SUL MAC, ANCHE FRA PROGETTI: il lucchetto sta fuori da tutti e due, in
#    ~/.squadra-turno.lock, e lo usa anche il turno di Agoranomos. Il conto dei token è uno solo.
# ⚠️ GLI AGENTI GIRANO SOLO NELLA FINESTRA (sabato dalle 14 a domenica alle 12), dopo quella di Agoranomos (venerdì
#    sera e sabato mattina): fuori, il turno va in coda e lo fa il giro del sabato. Gli script a zero token girano sempre.
# ⚠️ I segreti non passano di qui: gli script li leggono da ~/.skinmatch-segreti.env quando servono.
set -u
AGENTE="${1:?turno}"; COMPITO="${2:-}"
SM_DIR="$HOME/Skinmatch"; Q="$SM_DIR/squadra"; LOG="$Q/log"; OGGI=$(date +%Y-%m-%d)
mkdir -p "$LOG" "$Q/lavoro/zeno"
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin"
CLAUDE=$(ls -d "$HOME"/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | sort -t- -k3 -V | tail -1)
SM="python3 $SM_DIR/scripts/admin"
LUCCHETTO="$HOME/.squadra-turno.lock"
CODA="$Q/coda-settimana.tsv"
FILE_LOG="$LOG/$OGGI-$AGENTE${COMPITO:+-$COMPITO}.log"
exec >>"$FILE_LOG" 2>&1
echo "── $(date '+%d/%m %H:%M') turno $AGENTE $COMPITO"

if [ "$AGENTE-$COMPITO" = zeno-rivista ]; then
  GIORNI=$(( ( $(date +%s) - $(date -j -f %Y-%m-%d 2026-10-16 +%s) + 43200 ) / 86400 ))
  [ -n "${DENTRO_SETTIMANA:-}" ] || [ $(( GIORNI % 2 )) -eq 0 ] || { echo "oggi non tocca alla Rivista ($GIORNI giorni dal 16/10)"; exit 0; }
fi

FINESTRA="${FINESTRA:-}"
if [ -z "$FINESTRA" ]; then G=$(date +%u); H=$((10#$(date +%H))); { [ "$G" = 6 ] && [ $H -ge 14 ]; } || { [ "$G" = 7 ] && [ $H -lt 12 ]; } && FINESTRA=1; fi

salta() {   # il turno non è stato fatto: lo si scrive dove lo si legge
  echo "⚠️ TURNO NON FATTO ($AGENTE${COMPITO:+ $COMPITO}): $1"
  echo "$(date '+%Y-%m-%d %H:%M')	$AGENTE${COMPITO:+-$COMPITO}	$1" >> "$Q/turni-saltati.log"
}

prendi_lucchetto() {   # aspetta il turno di Agoranomos o un altro di Skinmatch (fino a $1 tentativi da 5 minuti)
  local i; for i in $(seq 1 "$1"); do mkdir "$LUCCHETTO" 2>/dev/null && { trap 'rmdir "$LUCCHETTO" 2>/dev/null' EXIT; return 0; }; echo "aspetto: c'è già un turno in corso"; sleep 300; done
  return 1
}

lancia() {   # lancia <agente> <brief>
  [ -x "$CLAUDE" ] || { echo "Claude Code non trovato"; return 1; }
  local ag="$1" brief="$2"
  if [ -z "$FINESTRA" ]; then   # fuori dalla finestra: in coda per il giro del sabato, senza doppioni
    local chiave="$AGENTE${COMPITO:+-$COMPITO}"
    grep -q "^$chiave	" "$CODA" 2>/dev/null || printf '%s\t%s\n' "$chiave" "$(date '+%d/%m %H:%M')" >> "$CODA"
    echo "rimandato al giro del sabato: $chiave (in coda dal $(grep "^$chiave	" "$CODA" | cut -f2))"
    return 0
  fi
  [ -n "${DENTRO_SETTIMANA:-}" ] || prendi_lucchetto 36 || { salta "lucchetto occupato da 3 ore"; return 3; }
  local t; for t in 1 2 3 4 5 6 7; do curl -s -m 8 -o /dev/null https://api.anthropic.com && break; [ "$t" = 7 ] && { salta "niente rete"; return 3; }; sleep 300; done
  local out="$Q/.turno-$$.out"
  cd "$HOME" && "$CLAUDE" -p "$brief" --agent "$ag" --model "${MODELLO:-claude-opus-5-5}" --effort "${SFORZO:-xhigh}" --permission-mode auto \
    --add-dir "$SM_DIR" 2>&1 | tee "$out"
  local codice=${PIPESTATUS[0]}
  if grep -qE "hit your [a-z0-9-]+ limit|Can't reach the API|ENOTFOUND|rate_limit" "$out"; then
    salta "$(grep -oE "hit your [a-z0-9-]+ limit[^.]*|Can't reach the API" "$out" | head -1)"; codice=3
  fi
  rm -f "$out"
  echo "── fine $(date '+%H:%M'), uscita $codice"
  return $codice
}

BACHECA="$Q/BACHECA.md"
case "$AGENTE${COMPITO:+-$COMPITO}" in
  mattina)
    $SM/vendite.py; python3 "$SM_DIR/scripts/catalogo/aggiorna.py"; $SM/pubblica.py --approvati ;;
  pubblica)
    $SM/pubblica.py --approvati ;;
  zeno-rivista)
    lancia zeno "Rivista di Skinmatch, $OGGI. Segui la sezione «Skinmatch» delle tue istruzioni: prima gli articoli da correggere ($SM/registro.py elenco articoli --stato da_correggere), poi un articolo nuovo che porta al test o a prodotti del catalogo. Registralo con $SM/registro.py articolo. Una riga in $BACHECA." ;;
  zeno-novita)
    lancia zeno "Novità della settimana per Skinmatch, $OGGI: lanci, ingredienti, studi, regole che contano per chi sceglie skincare, capelli e integratori. Fonti: $Q/lavoro/zeno/fonti-novita.md. Un articolo di tipo novita da approvare ($SM/registro.py articolo) e un rapporto breve ($SM/registro.py rapporto --agente zeno --tipo novita). Se trovi dati veri sui prodotti del catalogo, proponili con $SM/registro.py arricchimento." ;;
  zeno-schede)
    lancia zeno "Schede del catalogo di Skinmatch, $OGGI: arricchimento. Per primi gli integratori della decisione 17 in $SM_DIR/feeds-out/zeno-integratori-17.json (leggi la nota: quantità per porzione, --campo attivi), saltando quelli che hanno già un'informazione proposta o decisa. Poi finisci la lista $SM_DIR/feeds-out/zeno-inci-20261016.json (dove sei arrivato: zeno-inci-20261016-fatto.json), poi dalla lista $SM_DIR/feeds-out/da-arricchire-liki24.json (tutti i negozi del sito) prendi i primi 40 prodotti che non hanno già un'informazione proposta o decisa ($SM/registro.py elenco arricchimenti). Per ognuno cerca l'INCI ufficiale (sito della marca, poi il negozio che lo vende o una farmacia affidabile; INCIDecoder solo se non c'è altro, perché il PO approva da solo marca e negozi), copialo esatto e registralo: $SM/registro.py arricchimento --prodotto <id> --campo inci --valore '<INCI>' --fonte <indirizzo>. Se il produttore dichiara la percentuale degli attivi, registrala con --campo attivi --valore \"niacinamide 10%; acido salicilico 2%\". Se la pagina dice anche se è profumato o la texture, registra pure quelli. Niente a memoria e niente invenzioni: senza una fonte, salta il prodotto. Una riga in $BACHECA con quanti ne hai fatti." ;;
  zeno-testi)
    lancia zeno "Testi del test di Skinmatch, $OGGI. Brief: $Q/lavoro/zeno/testi-test.md (leggilo tutto). Le riscritture con $SM/registro.py riscrittura, il rapporto con $SM/registro.py rapporto. Niente modifiche ai file del sito. Una riga in $BACHECA." ;;
  friday-seo)
    lancia friday "Giro di ricercabilità di Skinmatch, $OGGI. Segui «Tutta la ricercabilità è tua» e «Skinmatch» delle tue istruzioni: Search Console con la chiave di Skinmatch (~/.skinmatch-gsc.json), rapporto e una segnalazione per ogni cosa da fare col registro di Skinmatch ($SM/registro.py), scelte Sì / Dopo / No. Niente modifiche al sito. Una riga in $BACHECA." ;;
  settimana)
    # IL GIRO DEL SABATO: la coda della settimana più i turni fissi, uno dopo l'altro, col lucchetto tenuto per tutti.
    # Aspetta fino a 12 ore che finisca il giro di Agoranomos. Ogni turno fatto si segna, così la ripresa della domenica
    # mattina riparte da dove era.
    prendi_lucchetto 144 || { salta "lucchetto occupato da 12 ore"; exit 3; }
    FATTI="$Q/settimana-$(date +%G-%V).fatti"; touch "$FATTI"
    FISSI="zeno-rivista zeno-schede zeno-testi zeno-novita friday-seo"
    for k in $(cut -f1 "$CODA" 2>/dev/null) $FISSI; do
      grep -qx "$k" "$FATTI" && continue
      echo "════ $k ($(date '+%a %H:%M'))"
      FINESTRA=1 DENTRO_SETTIMANA=1 bash "$0" "${k%%-*}" "${k#*-}"
      ret=$?
      if [ $ret -eq 3 ]; then echo "fermo: limite o rete, riprendo domenica mattina"; break; fi
      echo "$k" >> "$FATTI"
    done
    [ -f "$CODA" ] && { grep -vxFf "$FATTI" <(cut -f1 "$CODA") > "$CODA.n" 2>/dev/null; awk 'NR==FNR{k[$1];next} ($1 in k)' "$CODA.n" "$CODA" > "$CODA.t"; mv "$CODA.t" "$CODA"; rm -f "$CODA.n"; } ;;
  *) echo "turno sconosciuto: $AGENTE $COMPITO"; exit 1 ;;
esac
