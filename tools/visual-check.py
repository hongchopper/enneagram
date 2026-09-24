import sys, os, json, io
from PIL import Image
from playwright.sync_api import sync_playwright
src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
states = [
 ("home","showHomePage(false)"),("overview","showOverviewSection('basics',false)"),
 ("overview-growth","showOverviewSection('growth',false)"),("check","showCheckTarget('quick',false)"),
 ("handbook1","showHandbookType(1,false)"),("handbook6","showHandbookType(6,false)"),
 ("compare","showCompareSection('glance',false)"),("compare-centers","showCompareSection('centers',false)"),
 ("sharing","showSharingTopic(0,false)"),("myspace","showMySpaceSection('dashboard',false)"),
 ("reflection","showMySpaceSection('reflection',false)"),
]
widths=[int(w) for w in (sys.argv[3] if len(sys.argv)>3 else "360,390,768,1024,1440").split(',')]
H=900; MAXF=14
report={}; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for w in widths:
        pg=b.new_page(viewport={"width":w,"height":H},reduced_motion="reduce")
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.route("**/mcp.figma.com/**", lambda r: r.abort())
        pg.route("**/cdn.jsdelivr.net/**", lambda r: r.abort())
        pg.goto("file://"+os.path.abspath(src)); pg.add_style_tag(content="*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}"); pg.wait_for_timeout(800)
        for name,js in states:
            pg.evaluate(f"()=>{{ try{{ window.{js} }}catch(e){{}} }}"); pg.wait_for_timeout(250)
            info=pg.evaluate("""()=>{const a=document.querySelector('.page-panel.active')||document.scrollingElement;
               a.scrollTop=0; return {sh:a.scrollHeight,ch:a.clientHeight,sw:Math.max(a.scrollWidth,document.documentElement.scrollWidth)}}""")
            report[f"{name}@{w}"]=info
            frames=[]; y=0; n=0
            while n<MAXF:
                pg.evaluate(f"()=>{{const a=document.querySelector('.page-panel.active')||document.scrollingElement;a.scrollTop={y}}}"); pg.wait_for_timeout(60)
                frames.append(Image.open(io.BytesIO(pg.screenshot())).convert('RGB')); n+=1
                y+=info['ch']-80
                if y>=info['sh']-info['ch']+80 or info['ch']<=100: break
            im=Image.new('RGB',(w,H*len(frames)))
            for i,f in enumerate(frames): im.paste(f,(0,H*i))
            im.save(f"{outdir}/{name}@{w}.png")
        pg.close()
    b.close()
json.dump({"report":report,"errors":sorted(set(errs))},open(f"{outdir}/report.json","w"),indent=1,ensure_ascii=False)
print("errors:",sorted(set(errs))[:10])
print("overflow:",[k for k,v in report.items() if v["sw"]>int(k.split('@')[1])])
