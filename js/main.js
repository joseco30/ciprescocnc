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

// Smooth parallax on hero CNC background
const cncBg = document.querySelector('.hero-cnc-bg');
if (cncBg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        if (scrollY < heroHeight) {
            cncBg.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
    });
}
