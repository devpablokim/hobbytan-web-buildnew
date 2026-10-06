import numpy as np, json
from PIL import Image
import os
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE, '..', '..', 'public', 'assets', 'clients')
# idx, slug, name, source, mode  (alpha: every visible pixel is ink; ink: coloured pixels are ink, white = gap/background)
L=[('01','echoit','에코아이티','source/01-echoit.png','ink'),('02','sict','에스아이시티','source/02-sict-cap.png','ink'),
   ('03','bytesmix','바이츠믹스','source/03-bytesmix.png','ink'),('04','big3','큰삼촌컴퍼니','source/04-big3-og.png','ink'),
   ('05','enclu','엔클루','source/05-enclu-og.png','ink'),('06','bsn','빌사남 BSN','source/06-bsn.png','ink'),
   ('07','forpeople','포피플','source/07-fpeople.png','alpha'),('08','hiuplus','하이유플','source/08-hiuplus.png','alpha'),
   ('09','hiphone','하이폰','source/09-hiphone.png','alpha'),('10','shurim','슈림컴퍼니','source/10-shurim-a.png','ink'),('12','bltech','비엘테크','source/12-bltech-user.png','ink'),('11','maehong','매홍엘앤에프','source/11-maehong.png','ink'),
   ('13','nextbio','넥스트바이오','source/13-nextbio.png','alpha'),('14','shinjeong','신정개발','source/14-shinjeong.png','alpha'),
   ('15','dchoi','디초이글로벌','source/15-dchoi.png','ink'),('16','humanis','휴먼이즈','source/16-humanis.png','ink'),('17','plenty','더플렌티','source/17-plenty-logo-white.webp','alpha'),
   ('18','bb5','bb5','source/18-bb5.png','ink'),('19','yulip','율립','source/19-yulip-b.png','ink'),
   ('20','leejiyoung','이지영디자인','source/20-leejiyoung-a.png','ink'),('21','dokdo','독도문방구','source/21-dokdo.png','ink'),
   ('22','kigle','키글','source/22-kigle.png','ink')]
meta=[]
for idx,slug,name,src,mode in L:
    im=Image.open(src).convert('RGBA')
    if im.height < 200: im=im.resize((im.width*3, im.height*3), Image.LANCZOS)   # small sources: upscale before masking
    a=np.asarray(im).astype(np.float32)/255.0
    alpha=a[...,3]
    if mode=='alpha': m=alpha
    else:
        chroma=1.0-a[...,:3].min(-1)                      # distance from white
        m=alpha*np.clip((chroma-0.10)/0.35,0,1)
    ys,xs=np.where(m>0.06)
    y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    m=m[y0:y1,x0:x1]
    h,w=m.shape; pad=int(max(h,w)*0.03)
    m=np.pad(m,pad)
    img=Image.fromarray((m*255).astype(np.uint8),'L')
    if img.height>240: img=img.resize((round(img.width*240/img.height),240),Image.LANCZOS)
    for col,suf in [((255,255,255),'white'),((0,0,0),'black')]:
        o=Image.new('RGBA',img.size,col+(0,)); o.putalpha(img)
        o.save(f'{OUT}/{idx}-{slug}-{suf}.webp','WEBP',lossless=True,method=6)
    meta.append(dict(idx=idx,slug=slug,name=name,w=img.width,h=img.height))
    print(idx,slug,img.size)
json.dump(meta,open(os.path.join(HERE,'clients_meta.json'),'w'),ensure_ascii=False,indent=1)
