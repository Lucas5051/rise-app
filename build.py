#!/usr/bin/env python3
"""Assemble l'application : src/head.html + style.css + body.html + js/*.js (ordre alphabétique)."""
import glob,os,re,sys
R=os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(R,p),encoding='utf-8').read()
js=''.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(R,'src/js/*.js'))))
ver=re.search(r'version:"([^"]+)"',js).group(1)
vendor=open(os.path.join(R,'node_modules/@supabase/supabase-js/dist/umd/supabase.js'),encoding='utf-8').read().replace('if(!e)throw new Error("Automatic publicPath is not supported in this browser");','if(!e)e=location.href;') # script intégré : pas d'URL de script
html=rd('src/head.html')+'<style>'+rd('src/style.css')+'</style>\n</head>\n<body>'+rd('src/body.html')+'<script>/*! @supabase/supabase-js 2.45.4 | MIT License | intégré pour fonctionner hors ligne */\n'+vendor.replace('</script','<\\/script')+'</script>\n<script>'+js+'</script>\n</body>\n</html>\n'
for bad in ('service_role','SUPABASE_SERVICE','sb_secret_'):
    if bad in html: sys.exit('SECRET INTERDIT dans le HTML : '+bad)
out=os.path.join(R,'dist',f'USCI Muscu_{ver}.html'); open(out,'w',encoding='utf-8').write(html)
open(os.path.join(R,'dist','index.html'),'w',encoding='utf-8').write(html)
print(out,len(html))
