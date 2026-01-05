/* MZJ Mobile UI v2 (JS)
   - Mobile-first: visually remove topbar + sidebar (CSS handles visibility)
   - Convert ALL tables into mobile cards on small screens
   - Works with dynamic tables (MutationObserver on <tbody>)
   - No HTML changes required
*/
(function(){
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

  function textOf(el){
    return (el?.textContent || '').replace(/\s+/g,' ').trim();
  }

  function ensureCardsContainer(table){
    const wrap = table.closest('.table-wrap') || table.parentElement;
    if(!wrap) return null;

    let cards = wrap.querySelector('.mzj-cards');
    if(!cards){
      cards = document.createElement('div');
      cards.className = 'mzj-cards';
      // place after table
      wrap.appendChild(cards);
    }
    return cards;
  }

  function getHeaders(table){
    const ths = Array.from(table.querySelectorAll('thead th'));
    return ths.map(th => textOf(th) || '');
  }

  function buildCardFromRow(headers, tr){
    const tds = Array.from(tr.children);
    // Skip empty rows
    if(!tds.length) return null;

    // Title strategy:
    // Prefer VIN + Car if present. Otherwise first non-# column.
    // We identify columns by header text (Arabic).
    const h = headers.map(x=>x.toLowerCase());
    const idxVin = h.findIndex(x=>x.includes('الهيكل') || x.includes('vin'));
    const idxCar = h.findIndex(x=>x.includes('السيارة'));
    const idxDate = h.findIndex(x=>x.includes('التاريخ'));
    const idxFrom = h.findIndex(x=>x.includes('من'));
    const idxTo   = h.findIndex(x=>x.includes('إلى') || x.includes('الى'));
    const idxPlace= h.findIndex(x=>x.includes('المكان الحالي') || x.includes('المخزون'));

    const vin = idxVin>=0 ? textOf(tds[idxVin]) : '';
    const car = idxCar>=0 ? textOf(tds[idxCar]) : '';
    const date= idxDate>=0? textOf(tds[idxDate]): '';

    const title = (vin && car) ? `${vin} — ${car}` : (car || vin || textOf(tds[0]) || '—');

    const card = document.createElement('div');
    card.className = 'mzj-card-item';

    const top = document.createElement('div');
    top.className = 'mzj-card-top';

    const left = document.createElement('div');
    const h3 = document.createElement('div');
    h3.className = 'mzj-card-title';
    h3.textContent = title;

    const sub = document.createElement('div');
    sub.className = 'mzj-card-sub';
    // build small pills: date + from->to
    const from = idxFrom>=0 ? textOf(tds[idxFrom]) : '';
    const to   = idxTo>=0 ? textOf(tds[idxTo]) : '';
    const place= idxPlace>=0 ? textOf(tds[idxPlace]) : '';
    const parts = [];
    if(date) parts.push(date);
    if(from || to) parts.push(`${from || '—'} → ${to || '—'}`);
    if(place) parts.push(`المكان: ${place}`);
    sub.textContent = parts.join(' • ');
    left.appendChild(h3);
    if(sub.textContent) left.appendChild(sub);

    top.appendChild(left);
    card.appendChild(top);

    const kv = document.createElement('div');
    kv.className = 'mzj-kv';

    // Create key/value list for all columns except the title columns duplicated
    for(let i=0;i<tds.length;i++){
      const key = headers[i] || `حقل ${i+1}`;
      const valEl = tds[i];
      const valText = textOf(valEl);
      if(!valText) continue;

      // Skip pure index column (#) in cards
      if(key.trim() === '#') continue;

      // Skip if this is the same as title and would be redundant
      if(i===idxVin && vin && title.includes(vin) && key.includes('الهيكل')) continue;
      if(i===idxCar && car && title.includes(car) && key.includes('السيارة')) continue;

      const row = document.createElement('div');
      row.className = 'mzj-kv-row';

      const k = document.createElement('div');
      k.className = 'mzj-k';
      k.textContent = key;

      const v = document.createElement('div');
      v.className = 'mzj-v';

      // preserve copyable spans if exist
      const copyable = valEl.querySelector?.('.copyable');
      if(copyable){
        const copyTxt = copyable.getAttribute('data-copy') || valText;
        const a = document.createElement('span');
        a.className = 'mzj-copy';
        a.textContent = copyTxt;
        a.setAttribute('data-copy', copyTxt);
        a.style.cursor = 'pointer';
        v.appendChild(a);
      }else{
        v.textContent = valText;
      }

      row.appendChild(k);
      row.appendChild(v);
      kv.appendChild(row);
    }

    card.appendChild(kv);
    return card;
  }

  function renderCardsForTable(table){
    if(!isMobile()) return;

    const cards = ensureCardsContainer(table);
    if(!cards) return;

    const headers = getHeaders(table);
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    // Clear
    cards.innerHTML = '';

    rows.forEach(tr=>{
      const card = buildCardFromRow(headers, tr);
      if(card) cards.appendChild(card);
    });

    // If empty, show placeholder
    if(!cards.children.length){
      const empty = document.createElement('div');
      empty.className = 'mzj-card-item';
      empty.innerHTML = '<div class="mzj-card-title">لا توجد بيانات</div><div class="mzj-card-sub">—</div>';
      cards.appendChild(empty);
    }
  }

  function setupTableObserver(table){
    const tbody = table.querySelector('tbody');
    if(!tbody) return;

    const obs = new MutationObserver(()=>{
      // throttle by rAF
      requestAnimationFrame(()=> renderCardsForTable(table));
    });
    obs.observe(tbody, {childList:true, subtree:true, characterData:true});
  }

  function wireCopy(){
    document.addEventListener('click', (e)=>{
      const el = e.target.closest('[data-copy].mzj-copy, [data-copy].copyable');
      if(!el) return;
      const txt = (el.getAttribute('data-copy') || el.textContent || '').trim();
      if(!txt) return;
      navigator.clipboard?.writeText(txt).catch(()=>{});
    });
  }

  function init(){
    // Convert all tables
    const tables = Array.from(document.querySelectorAll('table'));
    tables.forEach(t=>{
      setupTableObserver(t);
      renderCardsForTable(t);
    });

    // Re-render on resize (switching breakpoint)
    window.addEventListener('resize', ()=>{
      if(!isMobile()) return;
      const tables2 = Array.from(document.querySelectorAll('table'));
      tables2.forEach(renderCardsForTable);
    }, {passive:true});

    wireCopy();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
