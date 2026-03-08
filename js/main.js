// Force scroll to top on page load
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    // Animate hamburger
    navToggle.classList.toggle('open');
});

nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        navToggle.classList.remove('open');
    });
});

// Header scroll effect
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
});

// Scroll animations with stagger
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.service-card, .material-card, .process-step, .gallery-item, .contact-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Animated counter for hero stats
function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(stat => {
        const text = stat.textContent;
        const match = text.match(/(\d+)/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = text.replace(match[1], '');
        let current = 0;
        const duration = 1500;
        const step = target / (duration / 16);

        const counter = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            stat.textContent = Math.floor(current) + suffix;
        }, 16);
    });
}

// Trigger counters when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// Smooth parallax on hero CNC background + section titles
const cncBg = document.querySelector('.hero-cnc-bg');
const isDesktop = window.innerWidth > 768;

if (isDesktop) {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;

        // Parallax CNC background
        if (cncBg && scrollY < heroHeight) {
            cncBg.style.transform = `translateY(${scrollY * 0.15}px)`;
        }

        // Parallax section titles
        document.querySelectorAll('.section-title').forEach(title => {
            const rect = title.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const offset = (rect.top - window.innerHeight / 2) * 0.04;
                title.style.transform = `translateY(${offset}px)`;
            }
        });
    });
}

// === Floating Particles ===
const canvas = document.getElementById('particles');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animId;

    function resizeCanvas() {
        const hero = document.querySelector('.hero');
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }

    function createParticles() {
        particles = [];
        const count = isDesktop ? 60 : 30;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.4 + 0.1,
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Mouse repel (desktop only)
            if (isDesktop) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    p.x += dx * 0.02;
                    p.y += dy * 0.02;
                }
            }

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(76, 175, 80, ${p.opacity})`;
            ctx.fill();

            // Draw connecting lines between nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(76, 175, 80, ${0.06 * (1 - dist / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        animId = requestAnimationFrame(drawParticles);
    }

    // Mouse tracking for particle interaction
    document.querySelector('.hero').addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    document.querySelector('.hero').addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Only animate when hero is visible
    const particleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                drawParticles();
            } else {
                cancelAnimationFrame(animId);
            }
        });
    });
    particleObserver.observe(document.querySelector('.hero'));

    resizeCanvas();
    createParticles();
    window.addEventListener('resize', () => { resizeCanvas(); createParticles(); });
}

// Lightbox gallery
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const galleryItems = document.querySelectorAll('.gallery-item');
let currentIndex = 0;

galleryItems.forEach((item, index) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', (e) => {
        e.preventDefault();
        currentIndex = index;
        const img = item.querySelector('img');
        openLightbox(img.src);
    });
});

function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].querySelector('img').src;
}

function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].querySelector('img').src;
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
});

// Touch swipe for lightbox on mobile
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});
lightbox.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) showPrev();
        else showNext();
    }
});
