(function(){
  const root = document.documentElement;
  const safeStorage = {
    get(key){ try { return localStorage.getItem(key); } catch(e) { return null; } },
    set(key, value){ try { localStorage.setItem(key, value); } catch(e) {} }
  };

  const savedTheme = safeStorage.get('muslanova-theme');
  if(savedTheme){ root.setAttribute('data-theme', savedTheme); }

  const refreshScroll = () => {
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
      window.ScrollTrigger.refresh();
    }
  };

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    safeStorage.set('muslanova-theme', theme);
    refreshScroll();
  };



  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalize = (value) => String(value ?? '').toLowerCase().trim();

  const youtubeIdFromUrl = (url) => {
    const str = String(url || '');
    const match = str.match(/[?&]v=([^&]+)/) || str.match(/youtu\.be\/([^?&/]+)/) || str.match(/shorts\/([^?&/]+)/);
    return match ? match[1] : '';
  };

  const renderFilterButtons = (container, labels, active, onClick) => {
    if(!container) return;
    container.innerHTML = labels.map(label => `<button type="button" class="${label === active ? 'is-active' : ''}" data-filter="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('');
    container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => onClick(btn.dataset.filter || 'Все')));
  };

  const runDataPages = () => {
    const data = window.MUSLANOVA_DATA;
    if(!data) return;

    const pressMap = new Map((data.pressLinks || []).map(item => [item.id, item]));
    const projectsGrid = document.querySelector('[data-project-grid]');
    if(projectsGrid){
      const search = document.querySelector('[data-project-search]');
      const filters = document.querySelector('[data-project-filters]');
      let active = 'Все';
      const labels = ['Все', 'Россия', 'Европа', 'США', 'Австралия', 'Текущие'];
      const inFilter = (project) => {
        const country = normalize(project.performance && project.performance.country);
        const city = normalize(project.performance && project.performance.city);
        const theatre = normalize(project.performance && project.performance.theatre);
        const year = normalize(project.yearLabel || project.seasonOrDates || '');
        if(active === 'Все') return true;
        if(active === 'Россия') return country.includes('россия') || city.includes('новосибирск') || city.includes('москва') || theatre.includes('большой') || theatre.includes('перм');
        if(active === 'США') return country.includes('usa') || country.includes('сша') || theatre.includes('metropolitan');
        if(active === 'Австралия') return country.includes('australia') || country.includes('австралия') || theatre.includes('opera australia');
        if(active === 'Европа') return /austria|germany|spain|france|italy|czech|prague|bonn|madrid|lyon|napoli|san carlo|klagenfurt|darmstadt/.test(`${country} ${city} ${theatre}`);
        if(active === 'Текущие') return year.includes('2025') || year.includes('2026') || normalize(project.notesForEditor).includes('текущ');
        return true;
      };
      const render = () => {
        const q = normalize(search && search.value);
        const projects = (data.projects || []).filter(project => {
          const haystack = normalize([
            project.card && project.card.title,
            project.card && project.card.subtitle,
            project.card && project.card.badge,
            project.work && project.work.title,
            project.work && project.work.composer,
            project.performance && project.performance.role,
            project.performance && project.performance.theatre,
            project.performance && project.performance.city,
            project.yearLabel,
            project.seasonOrDates
          ].join(' '));
          return inFilter(project) && (!q || haystack.includes(q));
        });
        projectsGrid.innerHTML = projects.length ? projects.map((project, idx) => {
          const card = project.card || {};
          const perf = project.performance || {};
          const modal = project.modal || {};
          const press = (modal.pressLinkIds || []).slice(0, 4).map(id => pressMap.get(id)).filter(Boolean);
          const pressHtml = press.length ? `<div class="project-press"><span class="mini-label">Пресса</span><div class="press-chip-row">${press.map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.source || item.titleOrType || 'Источник')}</a>`).join('')}</div></div>` : '';
          return `<article class="project-card" data-reveal>
            <a class="project-card-main" href="${escapeHtml(project.sitePage || '#')}">
              <span class="project-index">${String(idx + 1).padStart(2, '0')}</span>
              <h3>${escapeHtml(card.title || (project.work && project.work.title) || 'Проект')}</h3>
              <p>${escapeHtml(card.subtitle || perf.theatre || '')}${card.year ? ' · ' + escapeHtml(card.year) : ''}</p>
              <strong>${escapeHtml(card.badge || perf.role || '')}</strong>
              <span class="details-link">Подробнее ↗</span>
            </a>
            ${pressHtml}
          </article>`;
        }).join('') : '<div class="empty-state">По этому запросу проектов не найдено.</div>';
      };
      const bindProjectFilters = () => renderFilterButtons(filters, labels, active, (label) => { active = label; bindProjectFilters(); render(); });
      bindProjectFilters();
      if(search) search.addEventListener('input', render);
      render();
    }

    const pressGrid = document.querySelector('[data-press-grid]');
    if(pressGrid){
      const search = document.querySelector('[data-press-search]');
      const filters = document.querySelector('[data-press-filters]');
      let active = 'Все';
      const sections = Array.from(new Set((data.pressLinks || []).map(item => item.section || 'Материал'))).slice(0, 8);
      const labels = ['Все', ...sections];
      const bindPressFilters = () => renderFilterButtons(filters, labels, active, (label) => { active = label; bindPressFilters(); render(); });
      const render = () => {
        const q = normalize(search && search.value);
        const items = (data.pressLinks || []).filter(item => {
          const haystack = normalize([item.section, item.project, item.theatreOrCity, item.year, item.source, item.titleOrType, item.archiveComment].join(' '));
          return (active === 'Все' || item.section === active) && (!q || haystack.includes(q));
        });
        pressGrid.innerHTML = items.length ? items.map(item => `<article class="press-card" data-reveal>
          <div class="card-top"><span>${escapeHtml(item.section || 'Пресса')}</span><span>${escapeHtml(item.year || '')}</span></div>
          <h3>${escapeHtml(item.project || item.titleOrType || 'Материал')}</h3>
          <p>${escapeHtml(item.titleOrType || '')}</p>
          <div class="press-meta"><span>${escapeHtml(item.source || '')}</span><span>${escapeHtml(item.theatreOrCity || '')}</span></div>
          <p>${escapeHtml(item.archiveComment || '')}</p>
          <a class="gold-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Открыть ↗</a>
        </article>`).join('') : '<div class="empty-state">По этому запросу материалов прессы не найдено.</div>';
      };
      bindPressFilters();
      if(search) search.addEventListener('input', render);
      render();
    }

    const videoGrid = document.querySelector('[data-video-grid]');
    if(videoGrid){
      const search = document.querySelector('[data-video-search]');
      const filters = document.querySelector('[data-video-filters]');
      let active = 'Все';
      const labels = ['Все', 'Direct video', 'Direct short', 'Channel', 'Playlist'];
      const bindVideoFilters = () => renderFilterButtons(filters, labels, active, (label) => { active = label; bindVideoFilters(); render(); });
      const render = () => {
        const q = normalize(search && search.value);
        const items = (data.videoLinks || []).filter(item => {
          const isRelevant = !normalize(item.status).includes('exclude');
          const haystack = normalize([item.status, item.type, item.title, item.channelOrUploader, item.workOrRole, item.notes].join(' '));
          return isRelevant && (active === 'Все' || item.status === active || item.type === active) && (!q || haystack.includes(q));
        });
        videoGrid.innerHTML = items.length ? items.map(item => {
          const id = youtubeIdFromUrl(item.url);
          const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'assets/img/6.png';
          return `<article class="video-card" data-reveal>
            <a class="video-thumb" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" aria-label="Открыть видео"><img src="${escapeHtml(thumb)}" alt=""></a>
            <div class="video-meta-row"><span>${escapeHtml(item.status || item.type || 'Видео')}</span><span>${escapeHtml(item.archiveStatus || '')}</span></div>
            <h3>${escapeHtml(item.title || 'Видео')}</h3>
            <p class="video-role"><span>${escapeHtml(item.workOrRole || '')}</span><span>${escapeHtml(item.channelOrUploader || '')}</span></p>
            <p>${escapeHtml(item.notes || '')}</p>
            <a class="video-open" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Смотреть ↗</a>
          </article>`;
        }).join('') : '<div class="empty-state">По этому запросу видео не найдено.</div>';
      };
      bindVideoFilters();
      if(search) search.addEventListener('input', render);
      render();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const hasGSAP = Boolean(window.gsap);
    const hasScrollTrigger = Boolean(window.ScrollTrigger);
    const canAnimate = hasGSAP && hasScrollTrigger;

    body.classList.toggle('motion-enabled', canAnimate);
    body.classList.toggle('no-gsap', !canAnimate);

    const progress = document.querySelector('.scroll-indicator');
    const updateProgress = () => {
      if(!progress) return;
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = h > 0 ? `${(scrollY / h) * 100}%` : '0%';
    };
    updateProgress();
    addEventListener('scroll', updateProgress, {passive:true});
    addEventListener('resize', updateProgress);

    document.querySelectorAll('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    }));

    document.querySelectorAll('.menu-toggle').forEach(btn => btn.addEventListener('click', () => {
      body.classList.toggle('menu-open');
    }));

    document.querySelectorAll('.curtain-links a').forEach(a => a.addEventListener('click', () => {
      body.classList.remove('menu-open');
    }));

    runDataPages();

    if(!canAnimate){
      return;
    }

    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);
    if(window.CustomEase){
      gsap.registerPlugin(window.CustomEase);
      window.CustomEase.create('luxEase','0.22,1,0.36,1');
    }

    if(window.Lenis){
      const lenis = new window.Lenis({lerp:0.065, wheelMultiplier:.82, smoothWheel:true});
      lenis.on('scroll', () => window.ScrollTrigger.update());
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const cursor = document.querySelector('.cursor-orb');
    if(cursor && matchMedia('(pointer:fine)').matches){
      gsap.to(cursor,{opacity:.85,duration:.5});
      addEventListener('pointermove',e=>gsap.to(cursor,{x:e.clientX,y:e.clientY,duration:.28,ease:'power3.out'}));
    }

    gsap.utils.toArray('[data-reveal]').forEach((el)=>{
      gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'luxEase',scrollTrigger:{trigger:el,start:'top 86%',toggleActions:'play none none reverse'}});
    });

    gsap.utils.toArray('[data-split-title]').forEach(title=>{
      const text = title.textContent.trim();
      title.innerHTML = text.split(' ').map(w=>`<span class="line-wrap"><span>${w}</span></span>`).join(' ');
      gsap.from(title.querySelectorAll('.line-wrap span'),{yPercent:110,rotate:2,stagger:.08,duration:1.1,ease:'luxEase',scrollTrigger:{trigger:title,start:'top 92%'}});
    });

    gsap.utils.toArray('[data-parallax]').forEach(el=>{
      const val = parseFloat(el.getAttribute('data-parallax')) || -10;
      gsap.to(el,{yPercent:val,ease:'none',scrollTrigger:{trigger:el.parentElement || el,start:'top bottom',end:'bottom top',scrub:true}});
    });

    const hero = document.querySelector('.hero');
    if(hero){
      gsap.from('.hero-title .title-line',{yPercent:110,rotate:3,stagger:.12,duration:1.3,ease:'luxEase'});
      gsap.from('.hero-card',{opacity:0,y:60,duration:1.1,delay:.35,ease:'luxEase'});
    }

    const work = document.querySelector('.work-section');
    if(work && matchMedia('(min-width: 1101px)').matches){
      const items = gsap.utils.toArray('.work-item');
      const tl = gsap.timeline({scrollTrigger:{trigger:work,start:'top top',end:()=>`+=${items.length * innerHeight * 1.05}`,pin:true,scrub:true,anticipatePin:1}});
      items.forEach((item,i)=>{
        const lines = item.querySelectorAll('[data-line]');
        if(i>0){
          tl.to(item,{clipPath:'inset(0% 0 0 0)',duration:1,ease:'none'},i);
        }
        tl.from(lines,{yPercent:120,rotate:2.5,stagger:.05,duration:.7,ease:'power2.out'},i+.12);
      });
    }

    gsap.utils.toArray('.horizontal-section').forEach((horizontal)=>{
      const track = horizontal.querySelector('.horizontal-track');
      if(!track || !matchMedia('(min-width: 1101px)').matches) return;
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      const isReverse = horizontal.getAttribute('data-direction') === 'reverse';

      if(isReverse){
        gsap.set(track,{x:()=>-distance()});
        gsap.to(track,{x:0,ease:'none',scrollTrigger:{trigger:horizontal,start:'top top',end:()=>`+=${distance()}`,pin:true,scrub:1,anticipatePin:1,invalidateOnRefresh:true,onRefresh:()=>gsap.set(track,{x:-distance()})}});
      } else {
        gsap.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger:horizontal,start:'top top',end:()=>`+=${distance()}`,pin:true,scrub:1,anticipatePin:1,invalidateOnRefresh:true}});
      }
    });

    gsap.utils.toArray('.gallery-grid figure').forEach((fig,i)=>{
      gsap.from(fig,{clipPath:'inset(100% 0 0 0)',duration:1.05,delay:(i%5)*.04,ease:'luxEase',scrollTrigger:{trigger:fig,start:'top 86%'}});
    });
  });
})();
