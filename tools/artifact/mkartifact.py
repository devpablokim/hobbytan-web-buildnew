"""Package dist/ as the artifact page (images embedded) and a local copy wrapped
in the same skeleton the claude.ai viewer injects, for faithful local testing."""
import re, base64, shutil, glob, os, sys
REPO=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SP=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
ART=SP+'/artifact'; SRV=SP+'/srv/art'
title=sys.argv[1] if len(sys.argv)>1 else 'HOBBYTAN AI'
src=open(REPO+'/dist/index.html').read()
head=re.search(r'<head>(.*?)</head>',src,re.S).group(1)
body=re.search(r'<body[^>]*>(.*?)</body>',src,re.S).group(1)
for pat in [r'<meta charset[^>]*>\s*', r'<meta name="viewport"[^>]*>\s*', r'<title>.*?</title>\s*']:
    head=re.sub(pat,'',head)
def emb(m):
    return 'data-img="data:image/webp;base64,'+base64.b64encode(open(REPO+'/dist/'+m.group(1),'rb').read()).decode()+'"'
cache={}
def uri(path):
    if path not in cache: cache[path]='data:image/webp;base64,'+base64.b64encode(open(REPO+'/dist/'+path,'rb').read()).decode()
    return cache[path]
# embed every generated image referenced from attributes (data-img, data-valley, data-faces)
body=re.sub(r'assets/(?:gen|clients)/[A-Za-z0-9_.-]+\.webp', lambda m: uri(m.group(0)), body)
page=f'<title>{title}</title>\n{head.strip()}\n<script>document.body.classList.add("is-loading")</script>\n{body.strip()}\n'
for d in (ART,SRV):
    os.makedirs(d+'/assets',exist_ok=True)
    for f in glob.glob(d+'/assets/index-*'): os.remove(f)
    for f in glob.glob(REPO+'/dist/assets/index-*'): shutil.copy(f,d+'/assets/')
open(ART+'/index.html','w').write(page)
SKEL='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n'
open(SRV+'/index.html','w').write(SKEL+page+'</body></html>')
print('page',len(page)//1024,'KB;', [os.path.basename(f) for f in glob.glob(ART+'/assets/index-*')])
