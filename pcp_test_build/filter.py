import sys, os, glob, re

def wordy(line):
    # keep lines that read like prose/options: >=3 alphabetic tokens of len>=2
    toks = re.findall(r"[A-Za-z][A-Za-z()/.\-']+", line)
    toks = [t for t in toks if len(t) >= 2]
    return len(toks) >= 3

OPT = re.compile(r"^\s*[©®OoQe@.*•\-]\s+\S")  # radio-bullet lines

for d in sys.argv[1:]:
    print(f"\n############ {d} ############")
    for f in sorted(glob.glob(os.path.join(d, "img-*.txt"))):
        lines = [l.rstrip() for l in open(f, errors="ignore")]
        keep = []
        for l in lines:
            if not l.strip():
                continue
            if OPT.match(l) or wordy(l):
                keep.append(l.strip())
        print(f"\n--- {os.path.basename(f)} ---")
        for l in keep:
            print("   " + l)
