#!/bin/bash
# Full automated suite in 3 parallel shards: static, e2e, taste_auto, overlap. Usage: tools/suite.sh <label>
# Runs from the course root. Takes ~6-8 minutes for ~27 lessons; run in the background if your shell times out.
cd "$(dirname "$0")/.."; LB=${1:-run}; T=eval/results/suite-$LB; mkdir -p $T
L=$(python3 -c "import json;print(' '.join(json.load(open('course.json'))['order']))"); set -- $L; N=$#; S=$(( (N+2)/3 ))
A="${@:1:$S}"; B="${@:$((S+1)):$S}"; C="${@:$((2*S+1))}"
python3 eval/static_eval.py > $T/s-$LB.txt 2>&1
for X in a b c; do eval IDS=\$$(echo $X | tr abc ABC); [ -z "$IDS" ] && continue; (E2E_OUT=eval/results/e2e-$LB$X.json python3 eval/e2e.py $IDS > $T/e-$LB$X.txt 2>&1; TASTE_OUT=eval/results/taste-$LB$X.json python3 eval/taste_auto.py $IDS > $T/t-$LB$X.txt 2>&1; OVERLAP_OUT=eval/results/ov-$LB$X.json python3 eval/overlap.py $IDS > $T/o-$LB$X.txt 2>&1) & done
wait
tail -n1 $T/s-$LB.txt; for f in $T/[eto]-$LB?.txt; do tail -n1 $f; done
grep -h -A3 -E "^FAIL" $T/[seto]-$LB*.txt | head -40
