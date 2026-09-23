# Read-only atlas analysis: compute SVG viewport/clip metadata; never alter image pixels.
import json
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image

def hull(points):
    points=sorted(set(points))
    def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower=[]
    for p in points:
        while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0:lower.pop()
        lower.append(p)
    upper=[]
    for p in reversed(points):
        while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0:upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]

config=json.loads(Path('config/game-config.json').read_text())
for s in config['animalSets']:
    im=Image.open(s['asset']).convert('RGBA')
    mask=np.array(im)[:,:,3]>20
    H,W=mask.shape
    components=[]
    for y,x in zip(*np.where(mask)):
        x,y=int(x),int(y)
        if not mask[y,x]:continue
        queue=deque([(x,y)]);mask[y,x]=False;rows={};size=0
        while queue:
            px,py=queue.popleft();size+=1
            if py not in rows:rows[py]=[px,px]
            else:rows[py]=[min(rows[py][0],px),max(rows[py][1],px)]
            for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                if 0<=nx<W and 0<=ny<H and mask[ny,nx]:mask[ny,nx]=False;queue.append((nx,ny))
        if size>1000:
            points=[(v,y) for y,ends in rows.items() for v in ends]
            shape=hull(points)
            x0=min(p[0] for p in shape);x1=max(p[0] for p in shape);y0=min(p[1] for p in shape);y1=max(p[1] for p in shape)
            cx=(x0+x1)/2;cy=(y0+y1)/2
            shape=[[round(cx+(x-cx)*1.018,2),round(cy+(y-cy)*1.018,2)] for x,y in shape]
            components.append(dict(size=size,x=x0-5,y=y0-5,width=x1-x0+10,height=y1-y0+10,clip=shape))
    biggest=sorted(components,key=lambda c:-c['size'])[:8]
    biggest=sorted(biggest,key=lambda c:(round((c['y']+c['height']/2)/H),c['x']))
    assert len(biggest)==8,(s['id'],len(biggest))
    s['imageWidth']=W;s['imageHeight']=H;s['frames']=biggest
    print(s['id'],[(c['x'],c['y'],c['width'],c['height']) for c in biggest])
Path('config/game-config.json').write_text(json.dumps(config,indent=2)+'\n')
Path('config/game-config.runtime.js').write_text('window.AnimalTypingRuntimeConfig = '+json.dumps(config,indent=2)+';\n')
