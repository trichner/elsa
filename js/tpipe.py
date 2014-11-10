__author__ = 'trichner'

import time


start = time.time()

import sys

# Prepends line with offset timestamp from start and writes it to stdout
def log_line(line):
    offset = time.time() - start
    log = '{0:.4f}'.format(offset)  + ':' +line
    sys.stdout.write(log)
    sys.stdout.flush()


while True:
    line = sys.stdin.readline()
    if not line: break # EOF
    log_line(line)