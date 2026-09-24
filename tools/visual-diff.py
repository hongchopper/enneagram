import sys,os
from PIL import Image, ImageChops
a,b=sys.argv[1],sys.argv[2]; bad=[]
for f in sorted(os.listdir(a)):
    if not f.endswith('.png'): continue
    A=Image.open(f"{a}/{f}").convert('RGB'); B=Image.open(f"{b}/{f}").convert('RGB')
    if A.size!=B.size: bad.append((f,'size',A.size,B.size)); continue
    d=ImageChops.difference(A,B).getbbox()
    if d: 
        px=sum(1 for p in ImageChops.difference(A,B).get_flattened_data() if max(p)>16)
        bad.append((f,'diff',d,px))
print(len(bad),"differ"); [print(x) for x in bad]
