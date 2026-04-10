// Custom Cursor Logic
const dot = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
const hoverTargets = document.querySelectorAll('.hover-target');
const cardContainer = document.querySelector('.action-card');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let trailX = mouseX;
let trailY = mouseY;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update dot position immediately
    dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
});

// Animation loop for trail easing
function animateTrail() {
    // Easing factor (lower = smoother/laggy)
    const easing = 0.15;
    
    trailX += (mouseX - trailX) * easing;
    trailY += (mouseY - trailY) * easing;
    
    trail.style.transform = `translate(calc(${trailX}px - 50%), calc(${trailY}px - 50%))`;
    
    requestAnimationFrame(animateTrail);
}
animateTrail();

// Hover interactions for the custom cursor
hoverTargets.forEach(target => {
    target.addEventListener('mouseenter', () => {
        trail.classList.add('hover-active');
        dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%)) scale(0)`; // hide dot
    });
    
    target.addEventListener('mouseleave', () => {
        trail.classList.remove('hover-active');
        dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%)) scale(1)`; // show dot
    });
});

// Magnetic effect on the button inside the action card
const btn = document.querySelector('.primary-btn');
if (btn) {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
    });
}


