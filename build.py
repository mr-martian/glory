#!/usr/bin/env python3

import json
import yaml

def make_html(blob):
    def readall(fname):
        with open(fname) as fin:
            return fin.read()
    template = readall('static/main.html')
    return template.format(
        css=readall('static/glory.css'),
        jquery=readall('static/jquery-3.6.0.slim.min.js'),
        cards=json.dumps(blob),
        js=readall('static/glory.js')
    )

if __name__ == '__main__':
    import sys
    with open(sys.argv[1]) as fin:
        blob = yaml.safe_load(fin)
        with open('build/game.html', 'w') as fout:
            fout.write(make_html(blob['locations']))

