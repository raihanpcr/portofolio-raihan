/* Behind the System — Three.js r128, no build step required. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const sections = [...document.querySelectorAll('.chapter')];
  const copies = [...document.querySelectorAll('.chapter-copy')];
  const notes = [...document.querySelectorAll('.scene-note')];
  const rail = [...document.querySelectorAll('.chapter-rail a')];
  const chapterNames = ['AWAL SEBUAH IDE', 'MERANCANG FONDASI', 'MENGHIDUPKAN SISTEM', 'JEJAK YANG NYATA', 'CERITA BERIKUTNYA'];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionPreference.matches;
  let rawProgress = 0, smoothProgress = 0, activeChapter = -1, featuredIndex = 0;
  let renderer, scene, camera, animationFrame = 0, sceneUpdate = () => {};
  let lastFrame = 0, animationTime = 0, needsRender = true, contextLost = false;
  const pointer = { x: 0, y: 0 }, smoothPointer = { x: 0, y: 0 };
  let offsets = [], viewportWidth = innerWidth, viewportHeight = innerHeight;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const pad = (n) => String(n).padStart(2, '0');
  const featured = [
    { name: 'Booktopia', type: 'MICROSERVICE', stack: 'Golang · PostgreSQL · Microservice', description: 'Dari memilih buku sampai berkirim hadiah. Layanan independen, satu pengalaman yang terhubung.', image: null },
    { name: 'SIMOGA', type: 'MONITORING SYSTEM', stack: 'CodeIgniter 3 · Bootstrap · MySQL', description: 'Menghubungkan data panen dan pengiriman. Membuat rantai pasok lebih transparan, satu dashboard dalam satu waktu.', image: 'assets/img_simoga.PNG' },
    { name: 'Web GIS DDDTLH', type: 'GEOGRAPHIC INFORMATION SYSTEM', stack: 'CodeIgniter 3 · MySQL · ArcMap', description: 'Data lingkungan menemukan konteksnya. Peta interaktif untuk membaca daya dukung dan daya tampung wilayah.', image: 'assets/img_dddtlh.PNG' }
  ];

  function readScroll() {
    const y = window.scrollY;
    let index = 0;
    for (let i = 0; i < offsets.length; i++) if (y >= offsets[i] - 1) index = i;
    rawProgress = Math.min(4, index + (index < 4 ? clamp((y - offsets[index]) / (offsets[index + 1] - offsets[index])) : 0));
    const percent = rawProgress / 4 * 100;
    $('progress-fill').style.width = percent + '%';
    $('progress-percent').textContent = pad(Math.round(percent)) + '%';
    const next = Math.min(4, Math.floor(rawProgress + .24));
    if (next !== activeChapter) {
      activeChapter = next;
      copies.forEach((copy, i) => {
        copy.classList.toggle('active', i === next);
        copy.inert = i !== next;
        copy.setAttribute('aria-hidden', String(i !== next));
      });
      notes.forEach((note, i) => { note.classList.toggle('active', i === next); note.setAttribute('aria-hidden', String(i !== next)); });
      rail.forEach((link, i) => {
        link.classList.toggle('active', i === next);
        if (i === next) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('selected', Number(link.dataset.nav) === 3 ? next === 3 : next < 3));
      $('chapter-index').innerHTML = pad(next + 1) + ' <span>/ 05</span>';
      $('chapter-name').textContent = chapterNames[next];
      document.body.dataset.chapter = next;
    }
    needsRender = true;
    startLoop();
  }

  function measure() {
    viewportWidth = innerWidth;
    viewportHeight = innerHeight;
    offsets = sections.map((section) => section.offsetTop);
    if (renderer) {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, viewportWidth < 701 ? 1.5 : 1.75));
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.setViewOffset(viewportWidth, viewportHeight, viewportWidth < 701 ? 0 : -viewportWidth * .205, viewportWidth < 701 ? viewportHeight * .19 : 0, viewportWidth, viewportHeight);
      camera.updateProjectionMatrix();
    }
    readScroll();
  }

  function goToChapter(index, updateHash = true) {
    const target = sections[index];
    if (!target) return;
    if (updateHash) history.pushState(null, '', '#' + target.id);
    window.scrollTo({ top: target.offsetTop, behavior: reduced ? 'instant' : 'smooth' });
  }
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const index = sections.findIndex((section) => '#' + section.id === link.getAttribute('href'));
      if (index < 0) return;
      event.preventDefault();
      goToChapter(index);
      // Keyboard users land on the newly revealed story, without losing scroll position.
      if (event.detail === 0) {
        const heading = sections[index].querySelector('h1,h2');
        heading.tabIndex = -1;
        const focusHeading = () => { if (activeChapter === index) heading.focus({ preventScroll: true }); };
        window.setTimeout(focusHeading, reduced ? 0 : 850);
      }
    });
  });
  window.addEventListener('popstate', () => {
    const index = sections.findIndex((s) => '#' + s.id === location.hash);
    goToChapter(Math.max(0, index), false);
  });
  $('replay').addEventListener('click', () => goToChapter(0));

  function updateMotionButton() {
    document.body.classList.toggle('reduced-motion', reduced);
    $('motion-toggle').setAttribute('aria-pressed', String(reduced));
    $('motion-toggle').setAttribute('aria-label', reduced ? 'Aktifkan animasi' : 'Kurangi animasi');
    $('motion-label').textContent = reduced ? 'Aktifkan gerak' : 'Jeda gerak';
    $('motion-icon').textContent = reduced ? '▷' : 'Ⅱ';
    needsRender = true;
    startLoop();
  }
  $('motion-toggle').addEventListener('click', () => { reduced = !reduced; updateMotionButton(); });
  motionPreference.addEventListener('change', (event) => { reduced = event.matches; updateMotionButton(); });
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced) return;
    pointer.x = (event.clientX / innerWidth - .5) * 2;
    pointer.y = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', measure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    else { lastFrame = 0; needsRender = true; startLoop(); }
  });

  // Native dialogs provide focus trapping, Escape dismissal, and focus restoration.
  const dialogs = [...document.querySelectorAll('dialog')];
  const openDialog = (dialog) => {
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
  };
  dialogs.forEach((dialog) => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; needsRender = true; startLoop(); });
  });
  $('about-open').addEventListener('click', () => openDialog($('about-dialog')));
  $('projects-open').addEventListener('click', () => openDialog($('projects-dialog')));
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  $('archive-grid').innerHTML = (window.PORTFOLIO_PROJECTS || []).map((project, index) =>
    '<article class="archive-card"><img src="' + escape(project.img) + '" alt="Pratinjau ' + escape(project.title) + '" loading="lazy" width="600" height="333">' +
    '<p class="project-type">' + pad(index + 1) + ' / ' + escape(project.badge.toUpperCase()) + '</p><h3>' + escape(project.title) + '</h3>' +
    '<span class="archive-stack">' + escape(project.stack) + '</span><p>' + escape(project.desc) + '</p><div class="archive-links">' +
    (project.links.length ? project.links.map((link) => '<a href="' + escape(link.url) + '" target="_blank" rel="noopener noreferrer">' + (link.label === 'github' ? 'Source code' : 'Live demo') + ' ↗</a>').join('') : '<span class="archive-private">Dokumentasi proyek</span>') + '</div></article>'
  ).join('');

  function changeProject(direction) {
    featuredIndex = (featuredIndex + direction + featured.length) % featured.length;
    const item = featured[featuredIndex];
    $('featured-type').textContent = pad(featuredIndex + 1) + ' / ' + item.type;
    $('featured-title').textContent = item.name;
    $('featured-description').textContent = item.description;
    $('featured-stack').textContent = item.stack;
    $('project-number').textContent = pad(featuredIndex + 1) + ' / 03';
    needsRender = true;
    startLoop();
  }
  $('project-prev').addEventListener('click', () => changeProject(-1));
  $('project-next').addEventListener('click', () => changeProject(1));

  function fallback() {
    document.body.classList.add('lightweight');
    $('fallback-notice').hidden = false;
    if (renderer) renderer.dispose();
    renderer = null;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function createWorld() {
    if (!window.THREE) return fallback();
    const T = window.THREE;
    const canvas = $('world');
    try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
    catch (_) { return fallback(); }
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .92;
    scene = new T.Scene();
    scene.fog = new T.FogExp2(0x101110, .031);
    camera = new T.PerspectiveCamera(36, innerWidth / innerHeight, .1, 100);
    scene.add(new T.HemisphereLight(0xe4ebd6, 0x171b15, .75));
    const key = new T.DirectionalLight(0xf4ffdd, 1.65); key.position.set(3, 9, 6); scene.add(key);
    const rim = new T.DirectionalLight(0xb7c2ab, 1.3); rim.position.set(-7, 3, -3); scene.add(rim);
    const orangeLight = new T.PointLight(0xff703b, 5, 16, 2); orangeLight.position.set(1, 1, 2); scene.add(orangeLight);

    const metal = new T.MeshStandardMaterial({ color: 0x2f392b, roughness: .36, metalness: .8 });
    const darkMetal = new T.MeshStandardMaterial({ color: 0x101a12, roughness: .45, metalness: .7 });
    const paleMetal = new T.MeshStandardMaterial({ color: 0x62694f, roughness: .28, metalness: .8 });
    const orange = new T.MeshBasicMaterial({ color: new T.Color(0xff7548).convertSRGBToLinear(), toneMapped: false, fog: false });
    const coreFaces = [0xdb542c, 0xb43d20, 0xffad75, 0xb74320, 0xff7548, 0xe76032].map((color) => new T.MeshBasicMaterial({ color: new T.Color(color).convertSRGBToLinear(), toneMapped: false, fog: false }));
    const dimOrange = new T.MeshBasicMaterial({ color: 0xc76e43, toneMapped: false });
    const lineMat = new T.LineBasicMaterial({ color: 0xb9c6a4, transparent: true, opacity: .27 });
    const unitBox = new T.BoxGeometry(1, 1, 1);
    const unitEdges = new T.EdgesGeometry(unitBox);
    function box(parent, dimensions, position, material = metal, edges = false) {
      const mesh = new T.Mesh(unitBox, material);
      mesh.scale.set(...dimensions); mesh.position.set(...position); parent.add(mesh);
      if (edges) mesh.add(new T.LineSegments(unitEdges, lineMat));
      return mesh;
    }
    function ring(parent, radius, tube, material, position, rotation = [Math.PI / 2, 0, 0]) {
      const mesh = new T.Mesh(new T.TorusGeometry(radius, tube, 8, 100), material);
      mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
    }
    function wire(parent, points, color = 0x738163, opacity = .5) {
      const geometry = new T.BufferGeometry().setFromPoints(points.map((p) => new T.Vector3(...p)));
      const mesh = new T.Line(geometry, new T.LineBasicMaterial({ color, transparent: true, opacity }));
      parent.add(mesh); return mesh;
    }
    function label(parent, text, position, width = 1.7, accent = false) {
      const surface = document.createElement('canvas'); surface.width = 512; surface.height = 80;
      const ctx = surface.getContext('2d'); ctx.clearRect(0, 0, 512, 80);
      ctx.fillStyle = accent ? '#ff9c6c' : '#c7cfb8'; ctx.font = '24px monospace'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 47);
      const texture = new T.CanvasTexture(surface);
      const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      sprite.position.set(...position); sprite.scale.set(width, width * 80 / 512, 1); parent.add(sprite); return sprite;
    }
    const floor = new T.GridHelper(160, 100, 0x525b42, 0x394132);
    floor.position.set(0, -3.2, -25); floor.material.transparent = true; floor.material.opacity = .12; scene.add(floor);
    // A quiet field of dust gives the camera's forward movement a sense of depth.
    const dustGeometry = new T.BufferGeometry();
    const dust = [];
    let seed = 721; const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 380; i++) dust.push((random() - .5) * 45, (random() - .35) * 18, 10 - random() * 78);
    dustGeometry.setAttribute('position', new T.Float32BufferAttribute(dust, 3));
    scene.add(new T.Points(dustGeometry, new T.PointsMaterial({ color: 0xbfc8a5, size: .025, transparent: true, opacity: .45, sizeAttenuation: true })));

    // CHAPTER 01–02: the same exploded machine assembles into an architecture.
    const machine = new T.Group(); scene.add(machine);
    const platform = new T.Group(); machine.add(platform);
    box(platform, [4.25, .24, 4.25], [0, -2.16, 0], darkMetal, true);
    box(platform, [3.8, .07, 3.8], [0, -2, 0], paleMetal, true);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      box(platform, [.15, .16, .15], [x * 1.8, -1.9, z * 1.8], orange);
    }
    const floorRing = ring(platform, 3.05, .012, dimOrange, [0, -2.2, 0]);
    ring(platform, 3.35, .009, new T.MeshBasicMaterial({ color: 0x6e775c, transparent: true, opacity: .35 }), [0, -2.21, 0]);
    const plates = [];
    for (let i = 0; i < 4; i++) {
      const plate = new T.Group(); machine.add(plate);
      box(plate, [2.65, .24, 2.65], [0, 0, 0], i === 3 ? paleMetal : metal, true);
      box(plate, [2.4, .06, 2.4], [0, .15, 0], darkMetal, true);
      box(plate, [2.12, .025, .055], [0, -.03, 1.338], orange);
      for (let j = 0; j < 9; j++) {
        box(plate, [.055, .11, .05], [-.95 + j * .24, .01, -1.34], paleMetal);
        box(plate, [.7, .022, .028], [-.55, .19, -.85 + j * .205], j === i * 2 ? orange : metal);
      }
      for (let x of [-1, 1]) for (let z of [-1, 1]) {
        const bolt = new T.Mesh(new T.CylinderGeometry(.055, .055, .06, 8), paleMetal);
        bolt.position.set(x * 1.18, .16, z * 1.18); plate.add(bolt);
      }
      plates.push(plate);
    }
    const core = new T.Group(); machine.add(core);
    const coreMesh = box(core, [.94, .94, .94], [0, 0, 0], coreFaces, true);
    const coreCage = box(core, [1.25, 1.25, 1.25], [0, 0, 0], new T.MeshBasicMaterial({ color: 0xeab88b, wireframe: true, transparent: true, opacity: .27 }));
    const orbit = ring(core, 1.25, .013, dimOrange, [0, 0, 0], [.8, .25, -.4]);
    const outerOrbit = ring(core, 1.53, .007, new T.MeshBasicMaterial({ color: 0x9baf81, transparent: true, opacity: .45 }), [0, 0, 0], [.7, -.3, .5]);
    const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
    const glowCtx = glowCanvas.getContext('2d');
    const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,117,49,.65)'); gradient.addColorStop(.25, 'rgba(255,100,25,.16)'); gradient.addColorStop(1, 'rgba(255,90,20,0)');
    glowCtx.fillStyle = gradient; glowCtx.fillRect(0, 0, 128, 128);
    const glowTexture = new T.CanvasTexture(glowCanvas);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    glow.scale.set(4.4, 4.4, 1); core.add(glow);
    label(machine, 'RA / SYSTEM CORE', [0, 3.35, 0], 2.6);
    const satellites = [];
    const satelliteAngles = [.2, 2.2, 4.3];
    const names = ['API GATEWAY', 'DATABASE', 'AUTH SERVICE'];
    satelliteAngles.forEach((angle, i) => {
      const group = new T.Group(); machine.add(group);
      box(group, [.9, 1.35, .85], [0, 0, 0], darkMetal, true);
      for (let j = 0; j < 4; j++) {
        box(group, [.72, .17, .06], [0, -.46 + j * .29, .45], metal);
        box(group, [.08, .035, .02], [.22, -.44 + j * .29, .49], orange);
      }
      label(group, names[i], [0, 1.05, 0], 1.8);
      satellites.push({ group, angle });
    });
    const circuitLines = new T.Group(); machine.add(circuitLines);
    satelliteAngles.forEach((a) => {
      const x = Math.cos(a) * 3.7, z = Math.sin(a) * 3.7;
      wire(circuitLines, [[0, -1.96, 0], [x * .5, -1.96, 0], [x, -1.96, z]], 0xff7548, .75);
    });
    // Precise corner brackets and vertical construction guides.
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      wire(machine, [[x * 1.6, -1.8, z * 1.6], [x * 1.6, 2.6, z * 1.6]], 0x7b866d, .2);
    }

    // CHAPTER 03: the core travels through build / test / deploy gates.
    const pipeline = new T.Group(); pipeline.position.z = -18; scene.add(pipeline);
    const gates = [];
    for (let i = 0; i < 3; i++) {
      const gate = new T.Group(); gate.position.set(0, 0, 2.6 - i * 2.7); pipeline.add(gate);
      box(gate, [.2, 4.1, .24], [-1.9, 0, 0], metal, true);
      box(gate, [.2, 4.1, .24], [1.9, 0, 0], metal, true);
      box(gate, [4, .2, .24], [0, 2, 0], paleMetal, true);
      box(gate, [4, .2, .24], [0, -2, 0], darkMetal, true);
      box(gate, [.035, 3.72, .03], [-1.77, 0, .15], orange);
      box(gate, [.035, 3.72, .03], [1.77, 0, .15], orange);
      box(gate, [3.56, .035, .03], [0, 1.85, .15], orange);
      label(gate, ['01 / BUILD', '02 / TEST', '03 / DEPLOY'][i], [0, 2.5, 0], 2.3);
      gates.push(gate);
    }
    const delivery = box(pipeline, [.6, .6, .6], [0, 0, 3], coreFaces, true);
    const deliveryGlow = glow.clone(); deliveryGlow.scale.set(3, 3, 1); delivery.add(deliveryGlow);
    wire(pipeline, [[0, 0, 4], [0, 0, -5]], 0xf79c60, .7);
    box(pipeline, [4.6, .12, 9], [0, -2.2, -.6], darkMetal, true);
    const pipelineLight = new T.PointLight(0xff6622, 4, 9); pipeline.add(pipelineLight);

    // CHAPTER 04: real projects become floating exhibits in the same world.
    const gallery = new T.Group(); gallery.position.z = -36; scene.add(gallery);
    function projectTexture(item, index) {
      const surface = document.createElement('canvas'); surface.width = 1024; surface.height = 640;
      const ctx = surface.getContext('2d');
      const texture = new T.CanvasTexture(surface); texture.encoding = T.sRGBEncoding;
      function paint(img) {
        ctx.fillStyle = '#151a15'; ctx.fillRect(0, 0, 1024, 640);
        ctx.fillStyle = '#242c22'; ctx.fillRect(0, 0, 1024, 58);
        ['#ff7548', '#b3b98b', '#66715b'].forEach((color, i) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(27 + i * 23, 29, 5, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = '#c5cdb8'; ctx.font = '17px monospace'; ctx.fillText(item.name.toLowerCase() + ' / system overview', 128, 35);
        if (img) {
          const scale = Math.min(980 / img.width, 488 / img.height);
          ctx.drawImage(img, (1024 - img.width * scale) / 2, 76 + (488 - img.height * scale) / 2, img.width * scale, img.height * scale);
        } else {
          ctx.fillStyle = '#e6ebdc'; ctx.font = '48px sans-serif'; ctx.fillText(item.name, 50, 143);
          ctx.fillStyle = '#a0af90'; ctx.font = '17px monospace'; ctx.fillText(index === 0 ? 'INDEPENDENT SERVICES. ONE CONNECTED EXPERIENCE.' : item.type, 52, 181);
          const positions = [[382, 230], [102, 397], [382, 397], [662, 397]];
          ctx.strokeStyle = '#758964'; ctx.lineWidth = 2;
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(512, 302); ctx.lineTo(512, 349); ctx.lineTo(positions[i][0] + 130, 349); ctx.lineTo(positions[i][0] + 130, 397); ctx.stroke(); }
          positions.forEach(([x, y], i) => {
            ctx.fillStyle = i === 0 ? '#3a3427' : '#242f22'; ctx.fillRect(x, y, 260, 76);
            ctx.strokeStyle = i === 0 ? '#ff7548' : '#536449'; ctx.strokeRect(x, y, 260, 76);
            ctx.fillStyle = i === 0 ? '#ffb08c' : '#d5dfc7'; ctx.font = '18px monospace';
            ctx.fillText(['API GATEWAY', 'AUTH SERVICE', 'BOOK SERVICE', 'WALLET + GIFT'][i], x + 32, y + 43);
          });
        }
        ctx.fillStyle = '#ff966e'; ctx.font = '14px monospace'; ctx.fillText('RA / SELECTED WORK ' + pad(index + 1), 35, 609);
        ctx.fillStyle = '#8b9c7b'; ctx.fillText('BACKEND & FULLSTACK DEVELOPMENT', 590, 609);
        texture.needsUpdate = true; needsRender = true; startLoop();
      }
      paint();
      if (item.image) { const img = new Image(); img.onload = () => paint(img); img.src = item.image; }
      return texture;
    }
    const screens = featured.map((item, i) => {
      const group = new T.Group(); gallery.add(group);
      box(group, [5.1, 3.25, .15], [0, 0, 0], darkMetal, true);
      const screen = new T.Mesh(new T.PlaneGeometry(4.95, 3.094), new T.MeshBasicMaterial({ map: projectTexture(item, i), toneMapped: false }));
      screen.position.z = .086; group.add(screen);
      box(group, [1, .035, .05], [0, -1.73, .08], orange);
      label(group, pad(i + 1) + ' / ' + item.name.toUpperCase(), [0, -2.05, .1], 3.6);
      return group;
    });
    ring(gallery, 3.7, .012, dimOrange, [0, -2.55, 0]);
    ring(gallery, 4.1, .008, new T.MeshBasicMaterial({ color: 0x798765, transparent: true, opacity: .3 }), [0, -2.57, 0]);

    // CHAPTER 05: an open portal, leaving room for the next idea.
    const finale = new T.Group(); finale.position.z = -54; scene.add(finale);
    const portal = new T.Group(); finale.add(portal);
    const portalRing = ring(portal, 2.25, .11, metal, [0, .15, 0], [0, 0, 0]);
    ring(portal, 2.08, .035, orange, [0, .15, .1], [0, 0, 0]);
    ring(portal, 2.5, .012, dimOrange, [0, .15, 0], [0, 0, 0]);
    const finalCore = box(portal, [.63, .63, .63], [0, .15, 0], coreFaces, true);
    const finalGlow = glow.clone(); finalGlow.scale.set(5, 5, 1); finalCore.add(finalGlow);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const marker = box(portal, [.055, .22, .09], [Math.cos(a) * 2.36, Math.sin(a) * 2.36 + .15, .06], paleMetal);
      marker.rotation.z = a - Math.PI / 2;
    }
    box(finale, [4.8, .2, 3.4], [0, -2.65, 0], darkMetal, true);
    label(finale, 'YOUR NEXT IDEA', [0, 3.1, 0], 3);
    const finalLight = new T.PointLight(0xff7548, 5, 9); finalLight.position.set(0, 0, 1); finale.add(finalLight);

    // A continuous signal joins the scenes. Scroll moves the camera along it.
    const path = new T.CatmullRomCurve3([
      new T.Vector3(0, -2.14, 0), new T.Vector3(3.5, -2.7, -6),
      new T.Vector3(-.5, -2.3, -18), new T.Vector3(2, -2.7, -27),
      new T.Vector3(0, -2.6, -36), new T.Vector3(-2, -2.8, -45), new T.Vector3(0, -2.7, -54)
    ]);
    scene.add(new T.Mesh(new T.TubeGeometry(path, 180, .017, 5, false), dimOrange));
    const signal = new T.Mesh(new T.SphereGeometry(.085, 10, 10), orange); scene.add(signal);
    const cameras = [[8, 5.2, 12], [7.5, 5.7, 11.5], [7.7, 3.7, -6.8], [5, 3, -24.3], [5.2, 3.4, -42]];
    const targets = [[0, .25, 0], [0, -.25, 0], [0, 0, -18.5], [0, 0, -36], [0, .2, -54]];
    const cameraPosition = new T.Vector3(), lookAt = new T.Vector3();
    let gallerySelection = 0;
    sceneUpdate = (progress, time, delta) => {
      const mobile = viewportWidth < 701;
      const stage = Math.min(3, Math.floor(progress)), fraction = ease(clamp(progress - stage));
      for (let axis = 0; axis < 3; axis++) {
        cameraPosition.setComponent(axis, lerp(cameras[stage][axis], cameras[stage + 1][axis], fraction));
        lookAt.setComponent(axis, lerp(targets[stage][axis], targets[stage + 1][axis], fraction));
      }
      if (mobile) {
        cameraPosition.x = lookAt.x + (cameraPosition.x - lookAt.x) * 1.15;
        cameraPosition.y += 1.4;
        cameraPosition.z += 8.5;
      }
      cameraPosition.x += reduced ? 0 : smoothPointer.x * .45;
      cameraPosition.y -= reduced ? 0 : smoothPointer.y * .26;
      camera.position.copy(cameraPosition); camera.lookAt(lookAt);
      const assembly = ease(clamp(progress));
      const float = Math.sin(time * .65) * .09;
      machine.visible = progress < 1.88;
      machine.rotation.y = -.22 + progress * .38 + (reduced ? 0 : Math.sin(time * .16) * .055);
      machine.position.y = float;
      plates.forEach((plate, i) => {
        const explodedY = [-1.55, -.68, 1.6, 2.48][i];
        const assembledY = [-1.35, -.93, -.51, -.09][i];
        plate.position.set(0, lerp(explodedY, assembledY, assembly), 0);
        plate.rotation.y = lerp((i - 1.5) * .075, 0, assembly);
      });
      core.position.y = lerp(.44, .95, assembly);
      coreMesh.rotation.set(time * .15 + progress, time * .19 + .45, .15);
      coreCage.rotation.copy(coreMesh.rotation);
      orbit.rotation.z = time * .1;
      outerOrbit.rotation.y = time * .12;
      glow.material.opacity = .55 + Math.sin(time) * .1;
      satellites.forEach(({ group, angle }, i) => {
        const distance = lerp(5.6, 3.45, assembly);
        group.position.set(Math.cos(angle) * distance, lerp(-.45, -.8, assembly) + Math.sin(time * .6 + i) * .055, Math.sin(angle) * distance);
        group.scale.setScalar(lerp(.08, 1, assembly));
        group.visible = progress > .08;
      });
      circuitLines.visible = progress > .3;
      floorRing.rotation.z = progress * .2;
      pipeline.visible = progress > 1.1 && progress < 2.9;
      pipeline.rotation.y = -.15;
      const deliveryProgress = clamp((progress - 1.55) / .9);
      delivery.position.z = lerp(3.5, -4, deliveryProgress);
      delivery.rotation.set(time * .25, time * .4, .25);
      pipelineLight.position.copy(delivery.position);
      gallery.visible = progress > 2.2 && progress < 3.9;
      gallerySelection += (featuredIndex - gallerySelection) * (reduced ? 1 : Math.min(1, delta * 7));
      screens.forEach((group, i) => {
        const relative = i - gallerySelection;
        group.position.set(relative * 1.85, Math.abs(relative) * .1 + Math.sin(time * .5 + i) * .04, -Math.abs(relative) * 1.55);
        group.rotation.y = relative * -.24;
        group.scale.setScalar(1 - Math.min(2, Math.abs(relative)) * .14);
      });
      gallery.rotation.y = -.15;
      finale.visible = progress > 3.1;
      portal.rotation.y = Math.sin(time * .2) * .12 - .3;
      finalCore.rotation.set(time * .2, time * .3, .3);
      portalRing.rotation.z = time * .08;
      signal.position.copy(path.getPoint(clamp(progress / 4)));
      orangeLight.position.z = lookAt.z + 2;
      $('coordinate').textContent = 'X ' + String(Math.round(progress * 128)).padStart(3, '0') + ' · Y ' + String(Math.round(Math.abs(camera.position.z) * 10)).padStart(3, '0');
    };
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault(); contextLost = true;
      $('fallback-notice').hidden = false;
      cancelAnimationFrame(animationFrame); animationFrame = 0;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      contextLost = false; $('fallback-notice').hidden = true; needsRender = true; startLoop();
    });
  }

  function frame(now) {
    animationFrame = 0;
    if (!renderer || document.hidden || contextLost) return;
    const delta = Math.min((now - (lastFrame || now)) / 1000, .05); lastFrame = now;
    const dialogOpen = dialogs.some((dialog) => dialog.open);
    if (!reduced && !dialogOpen) animationTime += delta;
    const previous = smoothProgress;
    smoothProgress += (rawProgress - smoothProgress) * (reduced ? 1 : 1 - Math.exp(-delta * 7));
    if (Math.abs(rawProgress - smoothProgress) < .0001) smoothProgress = rawProgress;
    smoothPointer.x += (pointer.x - smoothPointer.x) * .04;
    smoothPointer.y += (pointer.y - smoothPointer.y) * .04;
    if (needsRender || !reduced || previous !== smoothProgress) {
      sceneUpdate(smoothProgress, animationTime, delta);
      renderer.render(scene, camera);
      needsRender = false;
    }
    if ((!reduced && !dialogOpen) || smoothProgress !== rawProgress) startLoop();
  }
  function startLoop() {
    if (renderer && !animationFrame && !document.hidden && !contextLost) animationFrame = requestAnimationFrame(frame);
  }
  try { createWorld(); } catch (error) { console.warn('3D unavailable; lightweight story enabled.', error); fallback(); }
  measure();
  updateMotionButton();
  // Respect deep links and browser-restored scroll positions.
  if (location.hash) requestAnimationFrame(() => {
    const index = sections.findIndex((s) => '#' + s.id === location.hash);
    if (index >= 0) window.scrollTo({ top: sections[index].offsetTop, behavior: 'instant' });
  });
})();

