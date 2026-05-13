(function(){
  const root = document.documentElement;
  const safeStorage = {
    get(key){ try { return localStorage.getItem(key); } catch(e) { return null; } },
    set(key, value){ try { localStorage.setItem(key, value); } catch(e) {} },
    remove(key){ try { localStorage.removeItem(key); } catch(e) {} }
  };

  const THEME_KEY = 'muslanova-theme-v2';
  safeStorage.remove('muslanova-theme');
  const savedTheme = safeStorage.get(THEME_KEY) || 'light';
  root.setAttribute('data-theme', savedTheme);

  const refreshScroll = () => {
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
      window.ScrollTrigger.refresh();
    }
  };

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    safeStorage.set(THEME_KEY, theme);
    refreshScroll();
  };


  const themeImageMap = {
    "1.png": "stage-black.png",
    "2.png": "stage-red.png",
    "3.png": "stage-black.png",
    "4.png": "stage-red.png",
    "6.png": "stage-black.png",
    "8b.png": "stage-purple.png",
    "9.png": "stage-officer.png",
    "12.png": "stage-purple.png",
    "14.png": "stage-black.png",
    "white-hero-01.png": "stage-black.png",
    "white-hero-02.png": "stage-red.png",
    "white-hero-03.png": "stage-purple.png",
    "white-hero-04.png": "stage-officer.png",
    "portrait-lux.png": "portrait-tux.png"
  };

  const fileNameOf = (src) => {
    if(!src) return "";
    const clean = src.split('?')[0].split('#')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1];
  };

  const replaceFileName = (src, nextFileName) => {
    const clean = src.split('?')[0].split('#')[0];
    return clean.replace(/[^/]+$/, nextFileName);
  };

  const applyThemeImages = (theme) => {
    document.querySelectorAll('img').forEach((img) => {
      const currentSrc = img.getAttribute('src');
      if(!currentSrc) return;

      if(!img.dataset.themeLightSrc){
        img.dataset.themeLightSrc = currentSrc;
      }

      if(!img.dataset.themeDarkSrc){
        const baseName = fileNameOf(img.dataset.themeLightSrc);
        if(themeImageMap[baseName]){
          img.dataset.themeDarkSrc = replaceFileName(img.dataset.themeLightSrc, themeImageMap[baseName]);
        }
      }

      if(theme === 'dark' && img.dataset.themeDarkSrc){
        if(img.getAttribute('src') !== img.dataset.themeDarkSrc){
          img.setAttribute('src', img.dataset.themeDarkSrc);
        }
      } else if(theme === 'light' && img.dataset.themeLightSrc){
        if(img.getAttribute('src') !== img.dataset.themeLightSrc){
          img.setAttribute('src', img.dataset.themeLightSrc);
        }
      }
    });
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

    applyThemeImages(root.getAttribute('data-theme') || 'light');

    document.querySelectorAll('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      applyThemeImages(nextTheme);
    }));

    document.querySelectorAll('.menu-toggle').forEach(btn => btn.addEventListener('click', () => {
      body.classList.toggle('menu-open');
    }));

    document.querySelectorAll('.curtain-links a').forEach(a => a.addEventListener('click', () => {
      body.classList.remove('menu-open');
    }));

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
