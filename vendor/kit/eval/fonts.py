"""Serve the course fonts locally in eval browsers (Google Fonts is unreachable from the sandbox)."""
import os
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'fonts')
def css():
    u=lambda f:'url("file://'+os.path.join(D,f)+'") format("woff2")'
    faces=[('Barlow Condensed',w,'normal',f'barlow-condensed-latin-{w}-normal.woff2') for w in (500,600,700)]
    faces+=[('Libre Franklin','100 900','normal','libre-franklin-latin-wght-normal.woff2'),('Libre Franklin','100 900','italic','libre-franklin-latin-wght-italic.woff2')]
    faces+=[('Courier Prime',w,'normal',f'courier-prime-latin-{w}-normal.woff2') for w in (400,700)]
    faces+=[('IBM Plex Mono',w,'normal',f'ibm-plex-mono-latin-{w}-normal.woff2') for w in (400,500)]
    faces+=[('Public Sans',w,'normal',f'public-sans-latin-{w}-normal.woff2') for w in (400,500,600,700)]  # v1 baseline body face
    faces+=[('Newsreader','200 800','normal','newsreader-latin-opsz-normal.woff2'),('Newsreader','200 800','italic','newsreader-latin-opsz-italic.woff2')]
    return '\n'.join(f'@font-face{{font-family:"{n}";font-weight:{w};font-style:{s};font-display:block;src:{u(f)}}}' for n,w,s,f in faces)
def install(ctx):
    body=css()
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=body))
    ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
