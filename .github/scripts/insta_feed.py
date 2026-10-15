#!/usr/bin/env python3
"""인스타그램 @ireland.sosik 최근 게시물 → insta.json + images/insta/*.jpg

홈 '아일랜드 소식은 인스타그램에서' 칸이 이 파일을 읽어 최근 게시물을 보여 준다.
GitHub Actions(.github/workflows/insta-feed.yml)가 한 시간마다 돌리고, 바뀐 것이 있을 때만 커밋한다.

토큰: 환경 변수 INSTAGRAM_TOKEN (Actions 저장소 secret) — 없으면 ~/.config/irelanddonghaeng/instagram.json
      토큰 값은 어디에도 출력하지 않는다.
사용:  python3 .github/scripts/insta_feed.py            게시물 갱신
       python3 .github/scripts/insta_feed.py --html     + index.html 안의 첫 화면용 목록(insta:start~end)도 다시 쓴다 (로컬에서만)
       python3 .github/scripts/insta_feed.py --refresh  + 토큰 연장 시도(하루 한 번이면 충분)
"""
import datetime as dt, json, os, re, shutil, subprocess, sys, tempfile
from html import escape
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[2]
OUT_JSON = ROOT / 'insta.json'
IMG_DIR = ROOT / 'images' / 'insta'
INDEX = ROOT / 'index.html'
API = 'https://graph.instagram.com'
SHOW = 10          # 홈에 보여 줄 게시물 수
KEEP = 40          # 사진 파일은 최근 40개까지 남긴다 (첫 화면용 목록이 조금 낡아도 사진이 깨지지 않게)
WIDTH = 600        # 줄 한 칸이 최대 300px → 2배 화면까지
SKIP = set()       # 홈에 띄우지 않을 게시물 id (예: {'18012345678901234'})


def token():
    t = os.environ.get('INSTAGRAM_TOKEN', '').strip()
    if t:
        return t, None
    f = Path.home() / '.config' / 'irelanddonghaeng' / 'instagram.json'
    if f.exists():
        return json.loads(f.read_text())['access_token'], f
    sys.exit('토큰이 없습니다 (INSTAGRAM_TOKEN 또는 ~/.config/irelanddonghaeng/instagram.json)')


def curl_get(url, binary=False):
    """키가 명령줄(argv)에 남지 않게 curl 설정을 stdin으로 넘긴다."""
    cfg = 'url = "%s"\nsilent\nshow-error\nlocation\nmax-time = 40\nwrite-out = "\\n%%{http_code}"\n' % url
    r = subprocess.run(['curl', '-K', '-'], input=cfg.encode(), capture_output=True)
    body, _, code = r.stdout.rpartition(b'\n')
    code = int(code or 0)
    return code, (body if binary else body.decode('utf-8', 'replace'))


def api(path, tok, **params):
    params['access_token'] = tok
    code, body = curl_get(API + path + '?' + urlencode(params))
    try:
        data = json.loads(body)
    except ValueError:
        data = {}
    if code != 200 or 'error' in data:
        msg = (data.get('error') or {}).get('message', body[:160])
        sys.exit('Instagram API 오류 (HTTP %s): %s' % (code, msg))
    return data


def refresh(tok, src_file):
    """60일 장기 토큰 연장. 받은 지 24시간이 안 됐으면 Instagram이 거절한다 — 그때는 조용히 넘어간다."""
    code, body = curl_get(API + '/refresh_access_token?' + urlencode({'grant_type': 'ig_refresh_token', 'access_token': tok}))
    try:
        data = json.loads(body)
    except ValueError:
        data = {}
    new = data.get('access_token')
    if code != 200 or not new:
        print('토큰 연장 건너뜀 (HTTP %s)' % code)
        return
    days = int(data.get('expires_in', 0)) // 86400
    if src_file:                                   # 로컬: 파일에 새 값 저장
        cfg = json.loads(src_file.read_text())
        cfg.update(access_token=new, saved_at=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'))
        src_file.write_text(json.dumps(cfg, ensure_ascii=False, indent=1))
        os.chmod(src_file, 0o600)
        print('토큰 연장됨 (%d일 남음)' % days)
    elif new != tok:                               # Actions: secret은 스스로 못 바꾼다 → 알림만
        note = '토큰 문자열이 바뀌었습니다. 저장소 secret INSTAGRAM_TOKEN을 새 값으로 바꿔야 %d일 뒤에도 동작합니다.' % days
        print('::warning::' + note)
        summ = os.environ.get('GITHUB_STEP_SUMMARY')
        if summ:
            with open(summ, 'a') as f:
                f.write(note + '\n')
    else:
        print('토큰 연장됨 (%d일 남음)' % days)


EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200D\u20E3\U000E0000-\U000E007F]')

def short_text(caption):
    """캡션 첫 줄 → (분류, 제목). '[리콜, 안전] 이번 주…'면 분류 '리콜, 안전'. 해시태그·이모지는 빼고 제목은 60자 안으로."""
    for line in (caption or '').splitlines():
        line = EMOJI.sub('', re.sub(r'#\S+', '', line))
        line = re.sub(r'\s{2,}', ' ', line).strip(' ·|-—:')
        if len(line) < 4:
            continue
        cat = ''
        m = re.match(r'^\[([^\]]{1,20})\]\s*(.+)$', line)
        if m:
            cat, line = m.group(1).strip(), m.group(2).strip()
        line = re.sub(r'^<(.+)>$', r'\1', line).strip()
        return cat, (line if len(line) <= 60 else line[:58].rstrip() + '…')
    return '', ''


def save_image(url, dest):
    """받아서 가로 600px JPEG로. 메타데이터(위치 등)는 남기지 않는다."""
    code, data = curl_get(url, binary=True)
    if code != 200 or not data:
        raise RuntimeError('사진 받기 실패 HTTP %s' % code)
    tmp = Path(tempfile.mkdtemp()) / 'src'
    tmp.write_bytes(data)
    try:
        from PIL import Image                      # Actions(우분투)
        im = Image.open(tmp).convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(dest, 'JPEG', quality=80, optimize=True, progressive=True)
        return im.width, im.height
    except ImportError:
        pass
    if shutil.which('sips'):                       # 맥 로컬
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '--resampleWidth', str(WIDTH),
                        '--deleteColorManagementProperties', str(tmp), '--out', str(dest)], capture_output=True, check=True)
        subprocess.run(['sips', '--deleteProperty', 'all', str(dest)], capture_output=True)
        out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(dest)], capture_output=True, text=True).stdout
        w = int(re.search(r'pixelWidth: (\d+)', out).group(1)); h = int(re.search(r'pixelHeight: (\d+)', out).group(1))
        return w, h
    sys.exit('사진을 줄일 도구가 없습니다 (Pillow 또는 sips)')


def fetch(tok):
    fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}'
    data = api('/me/media', tok, fields=fields, limit=SHOW + len(SKIP) + 4)
    posts = []
    for m in data.get('data', []):
        if m['id'] in SKIP or not m.get('permalink'):
            continue
        kind = {'VIDEO': 'video', 'CAROUSEL_ALBUM': 'album'}.get(m.get('media_type'), 'image')
        src = m.get('thumbnail_url') if kind == 'video' else m.get('media_url')
        if kind == 'album' and not src:
            kids = (m.get('children') or {}).get('data') or [{}]
            src = kids[0].get('media_url') or kids[0].get('thumbnail_url')
        if not src:
            continue
        cat, text = short_text(m.get('caption'))
        posts.append({'id': m['id'], 'url': m['permalink'], 'src': src, 'kind': kind,
                      'date': (m.get('timestamp') or '')[:10], 'cat': cat, 'text': text})
        if len(posts) == SHOW:
            break
    return posts


def kr_date(iso):
    try:
        d = dt.date.fromisoformat(iso)
        return '%d월 %d일' % (d.month, d.day)
    except ValueError:
        return ''


def item_html(p):
    """scripts.js의 setupInstaFeed() item()과 같은 모양 — 둘을 같이 고칠 것."""
    alt = p['text'] or '인스타그램 게시물'
    tag = {'video': '<span class="jr-kind">릴스</span>', 'album': '<span class="jr-kind">여러 장</span>'}.get(p['kind'], '')
    cat = (' · ' + escape(p['cat'])) if p.get('cat') else ''
    return ('<figure class="jr-item" data-id="%s"><a class="jr-link" href="%s" target="_blank" rel="noopener">'
            '<div class="jr-img"><img src="%s" alt="%s" width="%d" height="%d" loading="lazy" decoding="async">%s</div>'
            '<figcaption><span class="jr-meta"><time datetime="%s">%s</time>%s</span>%s</figcaption></a></figure>'
            % (escape(p['id']), escape(p['url']), escape(p['img']), escape(alt), p['w'], p['h'], tag,
               escape(p['date']), kr_date(p['date']), cat,
               ('<span class="jr-title">%s</span>' % escape(p['text'])) if p['text'] else ''))


def write_html(posts):
    html = INDEX.read_text()
    block = '\n    '.join(item_html(p) for p in posts)
    new, n = re.subn(r'(<!-- insta:start[^>]*-->)(.*?)(\s*<!-- insta:end -->)',
                     lambda m: m.group(1) + '\n    ' + block + m.group(3), html, flags=re.S)
    if n != 1:
        sys.exit('index.html에서 insta:start/insta:end 표시를 찾지 못했습니다')
    if new != html:
        INDEX.write_text(new)
        print('index.html 첫 화면 목록 갱신')


def main():
    tok, src_file = token()
    if '--refresh' in sys.argv:
        refresh(tok, src_file)
        tok, src_file = token()
    posts = fetch(tok)
    if not posts:
        sys.exit('받아온 게시물이 없습니다')
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    old = {}
    if OUT_JSON.exists():
        try:
            old = {p['id']: p for p in json.loads(OUT_JSON.read_text()).get('posts', [])}
        except ValueError:
            pass
    for p in posts:
        dest = IMG_DIR / ('%s.jpg' % p['id'])
        p['img'] = 'images/insta/%s.jpg' % p['id']
        if dest.exists() and p['id'] in old:      # 이미 받은 사진은 다시 받지 않는다
            p['w'], p['h'] = old[p['id']]['w'], old[p['id']]['h']
        else:
            p['w'], p['h'] = save_image(p.pop('src'), dest)
        p.pop('src', None)
    # 사진 파일 정리: 지금 목록 + 예전 목록 가운데 최근 KEEP개만 남긴다
    keep_ids = [p['id'] for p in posts] + [i for i in old if i not in {p['id'] for p in posts}]
    keep = {'%s.jpg' % i for i in keep_ids[:KEEP]}
    for f in IMG_DIR.glob('*.jpg'):
        if f.name not in keep:
            f.unlink()
    prev = json.loads(OUT_JSON.read_text()) if OUT_JSON.exists() else {}
    if prev.get('posts') != posts:                 # 바뀐 게 없으면 파일을 건드리지 않는다 (불필요한 커밋 방지)
        OUT_JSON.write_text(json.dumps({'updated': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
                                        'profile': 'https://www.instagram.com/ireland.sosik/', 'posts': posts},
                                       ensure_ascii=False, indent=1) + '\n')
        print('insta.json 갱신 — 게시물 %d개' % len(posts))
    else:
        print('바뀐 게시물 없음')
    if '--html' in sys.argv:
        write_html(posts)


if __name__ == '__main__':
    main()
